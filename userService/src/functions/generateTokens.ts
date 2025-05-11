import * as jwt from 'jsonwebtoken';

export function generateTokens(payload: object): { accessToken: string, refreshToken: string } {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "20m" });

  return { accessToken, refreshToken };
}