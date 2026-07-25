# Synthesis gate

After parallel section workers finish:

1. Read all new `.hig/specs/<id>.md`
2. Check conflicts on materials, navigation chrome, density, and shared tokens
3. Ensure no worker proposed brand hex/font overwrites
4. Mark approved specs; only then allow `src/` implementation
5. Escalate unresolved conflicts to the user (do not auto-pick silently on materials)
