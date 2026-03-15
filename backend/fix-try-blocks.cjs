const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/routes');

// ─── user-preferences.ts ───────────────────────────────────────────────────
{
  const fp = path.join(dir, 'user-preferences.ts');
  let c = fs.readFileSync(fp, 'utf8');

  // Fix 1: Restore missing `  }` that closes the catch block in extractUserId.
  // Current: `  } catch {\n    return null;\n}`  (catch unclosed)
  // Target:  `  } catch {\n    return null;\n  }\n}`
  c = c.replace(
    '  } catch {\n    return null;\n}',
    '  } catch {\n    return null;\n  }\n}'
  );

  // Fix 2: GET handler - remove invalid catch-after-finally, also remove db.close()
  // Current: `    } finally {\n      db.close();\n    } catch (handlerErr_) { throw handlerErr_; }\n  });`
  // Target:  `    } catch (err) { throw err; }\n  });`
  c = c.replace(
    '    } finally {\n      db.close();\n    } catch (handlerErr_) { throw handlerErr_; }\n  });',
    '    } catch (err) { throw err; }\n  });'
  );

  // Fix 3: PUT handler - same pattern
  // (second occurrence of the same pattern gets replaced after Fix 2 consumed the first)
  c = c.replace(
    '    } finally {\n      db.close();\n    } catch (handlerErr_) { throw handlerErr_; }\n  });',
    '    } catch (err) { throw err; }\n  });'
  );

  fs.writeFileSync(fp, c);
  console.log('Fixed: user-preferences.ts');
}

// ─── form-configurator.ts ──────────────────────────────────────────────────
{
  const fp = path.join(dir, 'form-configurator.ts');
  let c = fs.readFileSync(fp, 'utf8');

  // Fix 1: ensureSchema finally block is missing its closing `  }`.
  // Current: `  } finally {\n}`  (finally body unclosed, then function closer)
  // Target:  `  } finally {\n  }\n}`
  c = c.replace('  } finally {\n}', '  } finally {\n  }\n}');

  // Fix 2: requireAuth catch block is missing its closing `  }`.
  // Current: `  } catch {\n    return null;\n}`
  // Target:  `  } catch {\n    return null;\n  }\n}`
  c = c.replace(
    '  } catch {\n    return null;\n}',
    '  } catch {\n    return null;\n  }\n}'
  );

  fs.writeFileSync(fp, c);
  console.log('Fixed: form-configurator.ts');
}

// ─── mobile-sync.ts ────────────────────────────────────────────────────────
{
  const fp = path.join(dir, 'mobile-sync.ts');
  let c = fs.readFileSync(fp, 'utf8');

  // Fix 1: initOnce bare try (if still present after previous runs)
  c = c.replace(/  try \{ ensureSchema\(db\); \}\n/g, '  ensureSchema(db);\n');

  // Fix 2: extractUserId catch block missing closing `  }`
  c = c.replace(
    '  } catch {\n    return null;\n}',
    '  } catch {\n    return null;\n  }\n}'
  );

  fs.writeFileSync(fp, c);
  console.log('Fixed: mobile-sync.ts');
}

// ─── near-miss-reports.ts ──────────────────────────────────────────────────
{
  const fp = path.join(dir, 'near-miss-reports.ts');
  let c = fs.readFileSync(fp, 'utf8');

  // Fix 1: initOnce bare try (if still present)
  c = c.replace(/  try \{ ensureSchema\(db\); \}\n/g, '  ensureSchema(db);\n');

  // Fix 2: requireAuth catch block missing closing `  }`
  c = c.replace(
    '  } catch {\n    return null;\n}',
    '  } catch {\n    return null;\n  }\n}'
  );

  fs.writeFileSync(fp, c);
  console.log('Fixed: near-miss-reports.ts');
}

// ─── worker-app.ts ─────────────────────────────────────────────────────────
{
  const fp = path.join(dir, 'worker-app.ts');
  let c = fs.readFileSync(fp, 'utf8');

  // Fix 1: initOnce bare try (if still present)
  c = c.replace(/  try \{ ensureSchema\(db\); \}\n/g, '  ensureSchema(db);\n');

  // Fix 2: extractUserId catch block missing closing `  }`
  c = c.replace(
    '  } catch {\n    return null;\n}',
    '  } catch {\n    return null;\n  }\n}'
  );

  fs.writeFileSync(fp, c);
  console.log('Fixed: worker-app.ts');
}

