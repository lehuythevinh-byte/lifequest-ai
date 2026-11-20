# V78.1 Listening World

V77.5 baseline: f8655eeef410b5a71e9bf23169bde6c62ef1a9ce9a3f9312fb31c829f5457306
Target SHA-256: 8c9ce6e06eea9bb4931b0d5e50c2a4e0741e7be816c49d7dc165b7aea726ff45

Apply the 17 ordered line edits in listening-world-release.patch.json in reverse order to the baseline split("\n"); ranges are 1-based inclusive, insertion has end=start-1. Run build-listening.cjs via build.sh to verify each release and write game.html. This consolidated patch includes V78 and V78.1. No credentials committed.
