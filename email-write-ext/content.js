console.log("🚀 Email Writer Assistant Loaded");

// ✅ Utility: extract email body
function getEmailContent() {
    const selectors = [".h7", ".a3s.aiL", ".gmail_quote", "[role='presentation']"];
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element.innerText.trim();
    }
    return "";
}

// ✅ Find Gmail compose toolbar
function findComposeToolbar() {
    const selectors = [".btC", ".aDh", "[role='toolbar']", ".gU.Up"];
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) return toolbar;
    }
    return null;
}

// ✅ Create tone selector
function createToneSelector() {
    const select = document.createElement("select");
    select.className = "ai-tone-selector";
    select.style.marginRight = "8px";
    select.style.padding = "4px";
    select.style.borderRadius = "6px";
    select.style.border = "1px solid #ccc";

    const tones = ["professional", "friendly", "casual", "concise"];
    tones.forEach((tone) => {
        const option = document.createElement("option");
        option.value = tone;
        option.innerText = tone.charAt(0).toUpperCase() + tone.slice(1);
        select.appendChild(option);
    });

    // ✅ Load last selected tone from storage
    const savedTone = localStorage.getItem("aiSelectedTone");
    if (savedTone) select.value = savedTone;

    select.addEventListener("change", () => {
        localStorage.setItem("aiSelectedTone", select.value);
    });

    return select;
}

// ✅ Create button
function createAIButton() {
    const button = document.createElement("button");
    button.className = "ai-reply-button";
    button.style.marginRight = "8px";
    button.style.padding = "6px 12px";
    button.style.border = "none";
    button.style.borderRadius = "20px";
    button.style.background = "#1a73e8";
    button.style.color = "white";
    button.style.cursor = "pointer";
    button.style.fontSize = "13px";
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.gap = "6px";

    button.innerHTML = `🤖 <span>AI Reply</span>`;
    return button;
}

// ✅ Show error inside compose UI instead of alert
function showError(message) {
    const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');
    if (!composeBox) return;

    let errorBox = document.querySelector(".ai-error-box");
    if (!errorBox) {
        errorBox = document.createElement("div");
        errorBox.className = "ai-error-box";
        errorBox.style.color = "red";
        errorBox.style.fontSize = "12px";
        errorBox.style.marginTop = "6px";
        composeBox.parentElement.appendChild(errorBox);
    }
    errorBox.innerText = message;
}

// ✅ Generate AI reply
async function generateReply(button, tone) {
    try {
        button.innerHTML = `<span class="loader"></span> Generating...`;
        button.disabled = true;

        const emailContent = getEmailContent();

        const response = await fetch("http://localhost:8080/api/email/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailContent, tone }),
        });

        if (!response.ok) throw new Error(`❌ API failed: ${response.status}`);

        const generatedData = await response.text();

        const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');
        if (composeBox) {
            composeBox.focus();
            document.execCommand("insertText", false, `\n${generatedData}\n`);
        }
    } catch (error) {
        console.error("🔥 Error generating AI reply:", error);
        showError("Failed to generate AI reply. Check console.");
    } finally {
        button.innerHTML = `🤖 <span>AI Reply</span>`;
        button.disabled = false;
    }
}

// ✅ Inject button + tone selector
function injectButton() {
    if (document.querySelector(".ai-reply-button")) return;

    const toolbar = findComposeToolbar();
    if (!toolbar) {
        console.log("❌ Compose toolbar not found");
        return;
    }

    console.log("✅ Toolbar found:", toolbar);

    const toneSelector = createToneSelector();
    const button = createAIButton();

    button.addEventListener("click", () => {
        const selectedTone = toneSelector.value;
        generateReply(button, selectedTone);
    });

    // Insert tone selector + button
    toolbar.insertBefore(button, toolbar.firstChild);
    toolbar.insertBefore(toneSelector, button);
}

// ✅ Keyboard shortcut (Ctrl+Shift+R)
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "R") {
        const button = document.querySelector(".ai-reply-button");
        const toneSelector = document.querySelector(".ai-tone-selector");
        if (button && toneSelector) {
            generateReply(button, toneSelector.value);
        }
    }
});

// ✅ Observe Gmail DOM
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);

        const hasComposeElement = addedNodes.some((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return false;
            return (
                node.matches(".aDh, .btC, [role='dialog']") ||
                node.querySelector(".aDh, .btC, [role='dialog']")
            );
        });

        if (hasComposeElement) {
            console.log("✉️ Compose Window detected");
            setTimeout(injectButton, 500);
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });
