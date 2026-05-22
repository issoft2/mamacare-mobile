export function getTimeBasedGreeting(): string {
  const hr = new Date().getHours();
  if (hr < 12) return "Good morning";
  if (hr < 17) return "Good afternoon";
  return "Good evening";
}

export function getDailyMessage(): string {
  const messages = [
    "You are doing beautifully, even on the hard days.",
    "Your body is capable of extraordinary things.",
    "Breathe. You are exactly where you need to be.",
    "Small steps still move you forward.",
    "You are already a wonderful mother.",
  ];
  const day = new Date().getDate();
  return messages[day % messages.length];
}

