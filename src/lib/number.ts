// A fixed locale keeps server and client renders identical
const INTEGER_FORMAT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Format a number rounded to an integer with thousands separators */
export function formatInteger(value: number): string {
  return INTEGER_FORMAT.format(value);
}
