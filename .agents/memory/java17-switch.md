---
name: Java 17 switch syntax limit
description: Guarded switch expressions (case X when condition) require Java 21+; this project targets Java 17.
---

**Rule:** Never use `case X when condition ->` (pattern-matching switch with guards) in this codebase. The Maven compiler plugin is set to `release 17` and will fail with `: or -> expected` errors.

**Why:** Spring Boot 3.4 + Java 17 — that's the declared target. The Replit environment has Java 19 at runtime but `maven-compiler-plugin` enforces `release 17` source/target compliance, which excludes JEP 441 (pattern matching for switch with guards, Java 21).

**How to apply:** Replace any `switch (true) { case true when path.equals(…) -> … }` patterns with plain if-else chains. Standard `switch (stringVar) { case "literal" -> … }` (no guards) is fine in Java 14+.
