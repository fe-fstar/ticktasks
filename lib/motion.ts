// JS mirrors of the motion tokens in app/[locale]/globals.css, for Motion's
// `ease` option (which takes a cubic-bezier as an array, not a CSS string).

/** Strong ease-out: entrances, exits, anything responding to the user. */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/** Strong ease-in-out: elements already on screen moving from A to B. */
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
