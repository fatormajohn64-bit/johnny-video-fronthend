// =====================================
// J.A.X Main App
// =====================================

const chat = document.getElementById("chat");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");
const typing = document.getElementById("typing");
const backendStatus = document.getElementById("backendStatus");

// Check backend
async function checkBackend() {
    try {
        const data = await getBackendStatus();

        backendStatus.textContent = data.success
            ? "🟢 Backend Online"
            : "🔴 Backend Offline";
    } catch (e) {
        backendStatus.textContent = "🔴 Backend Offline";
    }
}

// Add message to chat
function addMessage(text, type) {

    const div = document.createElement("div");

    div.className =
        type === "user"
            ? "user-message"
            : "bot-message";

    div.innerHTML = `<p>${text}</p>`;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}

// Send chat
async function sendChat() {

    const message = messageInput.value.trim();

    if (!message) return;

    addMessage(message, "user");

    messageInput.value = "";

    typing.classList.remove("hidden");

    try {

        const result = await sendMessage(message);

        typing.classList.add("hidden");

        addMessage(result.reply, "bot");

    } catch (error) {

        typing.classList.add("hidden");

        addMessage(
            "Unable to connect to J.A.X.",
            "bot"
        );

        console.error(error);

    }
}

// Events
sendButton.onclick = sendChat;

messageInput.addEventListener("keydown", (e) => {

    if (e.key === "Enter" && !e.shiftKey) {

        e.preventDefault();

        sendChat();

    }

});

// Start app
checkBackend();
