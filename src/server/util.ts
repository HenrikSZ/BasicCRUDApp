/**
 * All other functions needed as helpers somewhere
 */


/**
 * Checks whether a given string is an integer
 *
 * @param n the string to be checked
 * @returns true if string is a positive or negative integer
 */
export function isInteger(n: string): boolean {
    return /^-?\d+$/.test(n)
}
