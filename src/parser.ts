import { add, scale, subtract, type DimensionTuple } from "./dimension.js";
import { UnknownUnitError, type UnitRegistry } from "./registry.js";

export class UnitParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnitParseError";
  }
}

export interface ResolvedUnit {
  /** Dimension vector of the whole expression. */
  dimension: DimensionTuple;
  /** Multiply a value in this unit by `factor` to reach SI base units. */
  factor: number;
  /** Additive shift in SI base units; only ever non-zero for a bare affine unit. */
  shift: number;
}

type Token =
  | { kind: "ident"; text: string }
  | { kind: "number"; value: number }
  | { kind: "op"; op: "*" | "/" | "^" }
  | { kind: "lparen" }
  | { kind: "rparen" };

const OPERATORS = new Set(["*", "/", "^", "(", ")"]);
const SUPERSCRIPT_EXPONENTS: Record<string, number> = { "²": 2, "³": 3 };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input.charAt(i);
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "(") {
      tokens.push({ kind: "lparen" });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ kind: "rparen" });
      i++;
      continue;
    }
    if (ch === "*" || ch === "/" || ch === "^") {
      tokens.push({ kind: "op", op: ch });
      i++;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < input.length && /[0-9.]/.test(input.charAt(j))) j++;
      const value = Number(input.slice(i, j));
      if (!Number.isFinite(value)) throw new UnitParseError(`invalid number near "${input.slice(i, j)}"`);
      tokens.push({ kind: "number", value });
      i = j;
      continue;
    }
    // A unit token: everything up to the next operator, paren or whitespace.
    let j = i;
    while (j < input.length && !/\s/.test(input.charAt(j)) && !OPERATORS.has(input.charAt(j))) j++;
    const text = input.slice(i, j);
    const sup = SUPERSCRIPT_EXPONENTS[text.charAt(text.length - 1)];
    if (sup !== undefined && text.length > 1) {
      // "m²" -> unit "m" raised to 2.
      tokens.push({ kind: "ident", text: text.slice(0, -1) });
      tokens.push({ kind: "op", op: "^" });
      tokens.push({ kind: "number", value: sup });
    } else {
      tokens.push({ kind: "ident", text });
    }
    i = j;
  }
  return tokens;
}

/**
 * Parse a unit expression such as `km/h`, `kg*m/s^2`, `m²` or a bare `°C`
 * into its dimension and its scale factor against SI base units.
 *
 * Adjacent factors multiply (`kg m` means `kg*m`), `per` reads as division,
 * and `^n` raises a factor to an integer power. Affine units (Celsius,
 * Fahrenheit) are only valid on their own — `°C/m` is meaningless.
 */
export function parseUnitExpression(input: string, registry: UnitRegistry): ResolvedUnit {
  const trimmed = input.trim();
  if (trimmed === "") throw new UnitParseError("empty unit expression");
  const tokens = tokenize(trimmed);
  const parser = new Parser(tokens, registry);
  const result = parser.parseExpression();
  if (parser.hasMore()) {
    throw new UnitParseError(`unexpected trailing input in "${input}"`);
  }
  return result;
}

class Parser {
  private pos = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly registry: UnitRegistry,
  ) {}

  hasMore(): boolean {
    return this.pos < this.tokens.length;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token | undefined {
    return this.tokens[this.pos++];
  }

  parseExpression(): ResolvedUnit {
    let result = this.parseTerm();
    for (;;) {
      const tok = this.peek();
      if (tok?.kind === "op" && (tok.op === "*" || tok.op === "/")) {
        this.next();
        const rhs = this.parseTerm();
        result = tok.op === "*" ? multiply(result, rhs) : divide(result, rhs);
      } else if (tok?.kind === "ident" && tok.text.toLowerCase() === "per") {
        this.next();
        const rhs = this.parseTerm();
        result = divide(result, rhs);
      } else if (tok?.kind === "ident" || tok?.kind === "lparen") {
        // Implicit multiplication: `kg m`, `m (s)`.
        const rhs = this.parseTerm();
        result = multiply(result, rhs);
      } else {
        return result;
      }
    }
  }

  private parseTerm(): ResolvedUnit {
    let base = this.parseFactor();
    const tok = this.peek();
    if (tok?.kind === "op" && tok.op === "^") {
      this.next();
      let negative = false;
      let expTok = this.next();
      if (expTok?.kind === "ident" && expTok.text === "-") {
        negative = true;
        expTok = this.next();
      } else if (expTok?.kind === "ident" && /^-\d+$/.test(expTok.text)) {
        // The tokenizer keeps "-1" as one token after "^".
        negative = true;
        expTok = { kind: "number", value: Number(expTok.text.slice(1)) };
      }
      if (expTok?.kind !== "number" || !Number.isInteger(expTok.value)) {
        throw new UnitParseError("exponent must be an integer, e.g. m^2 or s^-1");
      }
      const exponent = negative ? -expTok.value : expTok.value;
      base = power(base, exponent);
    }
    return base;
  }

  private parseFactor(): ResolvedUnit {
    const tok = this.next();
    if (!tok) throw new UnitParseError("unexpected end of unit expression");
    if (tok.kind === "lparen") {
      const inner = this.parseExpression();
      const close = this.next();
      if (close?.kind !== "rparen") throw new UnitParseError("missing closing parenthesis");
      return inner;
    }
    if (tok.kind !== "ident") {
      throw new UnitParseError(`expected a unit but found "${tokenText(tok)}"`);
    }
    // Try the longest multi-word match first ("nautical mile", "meters per
    // second"), falling back to the single token.
    const words = [tok.text];
    for (let extra = 1; extra <= 2; extra++) {
      const next = this.tokens[this.pos + extra - 1];
      if (next?.kind === "ident") words.push(next.text);
      else break;
    }
    for (let len = words.length; len >= 1; len--) {
      const candidate = words.slice(0, len).join(" ");
      const def = this.registry.lookup(candidate);
      if (def) {
        this.pos += len - 1;
        return { dimension: def.dimension, factor: def.factor, shift: def.shift ?? 0 };
      }
    }
    throw new UnknownUnitError(tok.text);
  }
}

function tokenText(tok: Token): string {
  if (tok.kind === "ident") return tok.text;
  if (tok.kind === "number") return String(tok.value);
  if (tok.kind === "op") return tok.op;
  return tok.kind === "lparen" ? "(" : ")";
}

function checkAffine(a: ResolvedUnit, b: ResolvedUnit): void {
  if (a.shift !== 0 || b.shift !== 0) {
    throw new UnitParseError(
      "affine units such as °C and °F can only be converted on their own, not as part of a compound unit",
    );
  }
}

function multiply(a: ResolvedUnit, b: ResolvedUnit): ResolvedUnit {
  checkAffine(a, b);
  return { dimension: add(a.dimension, b.dimension), factor: a.factor * b.factor, shift: 0 };
}

function divide(a: ResolvedUnit, b: ResolvedUnit): ResolvedUnit {
  checkAffine(a, b);
  return { dimension: subtract(a.dimension, b.dimension), factor: a.factor / b.factor, shift: 0 };
}

function power(a: ResolvedUnit, exponent: number): ResolvedUnit {
  if (a.shift !== 0) {
    throw new UnitParseError("affine units such as °C cannot be raised to a power");
  }
  return {
    dimension: scale(a.dimension, exponent),
    factor: a.factor ** exponent,
    shift: 0,
  };
}
