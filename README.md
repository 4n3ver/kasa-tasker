# Kasa Tasker
Tasker [JS integration](https://tasker.joaoapps.com/userguide/en/javascript.html) to toggle Kasa Relay.

### Input
This script expects the following input via local variables:

```typescript
kasausername: string;
kasapassword: string;
devicealias: string;
devicestate: "ON" | "OFF";
```

### Output
This script returns the following outputs via local variables:

```typescript
kasaok: "1" | undefined;
kasaerror: string | undefined;
```
