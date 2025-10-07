const jwt = require("jsonwebtoken");

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMTdiYzkxOS0zMmZkLTQ1NGEtODE2NS01OGI4OTJhMmVkYTkiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3NTk4MDQ5NTksImV4cCI6MTc2MDQwOTc1OX0.QFoGRE7mCGNmojfZ_le-DxhtkG820OV2KF0RveexytY";

// Decode without verification to see payload
const decoded = jwt.decode(token);
console.log("Decoded token payload:", JSON.stringify(decoded, null, 2));

// Check if token is expired
const now = Math.floor(Date.now() / 1000);
console.log("Current timestamp:", now);
console.log("Token expires at:", decoded.exp);
console.log("Token is expired:", now > decoded.exp);

// Try to verify with default secret
try {
  const verified = jwt.verify(
    token,
    "your-super-secret-jwt-key-change-in-production"
  );
  console.log("Token verification successful:", verified);
} catch (error) {
  console.log("Token verification failed:", error.message);
}
