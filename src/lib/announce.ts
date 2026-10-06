// For screen readers: text put in the live region (in the root layout) is read out.
export function announce(text: string) {
  const live = document.getElementById("live");
  if (!live) return;
  live.textContent = "";
  setTimeout(() => {
    live.textContent = text;
  }, 50);
}
