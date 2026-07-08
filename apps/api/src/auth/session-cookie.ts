export interface SessionCookieOptions {
  httpOnly: true;
  secure: true;
  sameSite: "strict";
  path: "/";
}

export function sessionCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  };
}
