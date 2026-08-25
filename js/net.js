const popup = document.getElementById("popup");

function show (text, status) {
  popup.innerText = text;
  popup.className = `popup show ${status}`;
  
  setTimeout(() => {
    popup.classList.remove("show");
  },5000)
}

window.onoffline = () => show("You are offline", "offline");
window.ononline = () => show("You are online", "online");