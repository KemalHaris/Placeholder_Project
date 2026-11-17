// Paste your Apps Script Web app URL (ends in /exec) here
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyXZK4EKqhb80hDGOovV4hOxDmxHKQlEWTGfAmVeZDOathr9qQwjWLFSxfAy8KhTe_Q/exec";

const form = document.getElementById("form");
const button = document.getElementById("submit-btn");
const status = document.getElementById("status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  button.disabled = true;
  status.textContent = "Sending...";

  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      body: new FormData(form),
      mode: "no-cors",
    });

    form.reset();
    status.textContent = "Sent! Thank you.";
  } catch (err) {
    console.error(err);
    status.textContent = "Something went wrong. Please try again.";
  } finally {
    button.disabled = false;
  }
});
