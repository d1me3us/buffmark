const params = new URLSearchParams(location.search);
const initialText = params.get("text") || "";

const form = document.querySelector("#bookmark-form");
const titleInput = document.querySelector("#title");
const folderSelect = document.querySelector("#folder");
const textTextarea = document.querySelector("#text");
const statusNode = document.querySelector("#status");
const cancelButton = document.querySelector("#cancel");

textTextarea.value = initialText;
titleInput.value = makeTitle(initialText);

cancelButton.addEventListener("click", () => {
  window.close();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  setStatus("Adding bookmark...");

  try {
    await chrome.storage.local.set({
      lastFolderId: folderSelect.value
    });

    await chrome.bookmarks.create({
      parentId: folderSelect.value,
      title: titleInput.value.trim() || makeTitle(textTextarea.value),
      url: makeBookmarklet(textTextarea.value)
    });

    setStatus("Bookmark added.");
    setTimeout(() => window.close(), 500);
  } catch (error) {
    submitButton.disabled = false;
    setStatus(error.message || "Could not add bookmark.");
  }
});

init();

async function init() {
  try {
    const [{ lastFolderId }, tree] = await Promise.all([
      chrome.storage.local.get("lastFolderId"),
      chrome.bookmarks.getTree()
    ]);
    const folders = [];
    collectFolders(tree, folders);

    folderSelect.replaceChildren(
      ...folders.map((folder) => {
        const option = document.createElement("option");
        option.value = folder.id;
        option.textContent = folder.label;
        return option;
      })
    );

    const lastFolder = folders.find((folder) => folder.id === lastFolderId);
    const bookmarksBar = folders.find((folder) => folder.id === "1");
    if (lastFolder) {
      folderSelect.value = lastFolder.id;
    } else if (bookmarksBar) {
      folderSelect.value = bookmarksBar.id;
    }
  } catch (error) {
    setStatus(error.message || "Could not load bookmark folders.");
  }
}

function collectFolders(nodes, folders, path = []) {
  for (const node of nodes) {
    const isFolder = !node.url;
    const nextPath = node.title ? [...path, node.title] : path;

    if (isFolder && node.id !== "0") {
      folders.push({
        id: node.id,
        label: nextPath.join(" / ") || "Bookmarks"
      });
    }

    if (node.children) {
      collectFolders(node.children, folders, nextPath);
    }
  }
}

function makeTitle(text) {
  const collapsed = text.trim().replace(/\s+/g, " ");
  return collapsed ? collapsed.slice(0, 80) : "Buffmark";
}

function makeBookmarklet(text) {
  const encodedText = encodeURIComponent(text);
  return `javascript:(function(){const text=decodeURIComponent("${encodedText}");const active=document.activeElement;if(active&&(active.tagName==="TEXTAREA"||(active.tagName==="INPUT"&&!/^(button|checkbox|color|date|datetime-local|file|hidden|image|month|number|radio|range|reset|submit|time|week)$/i.test(active.type)))){const start=active.selectionStart??active.value.length;const end=active.selectionEnd??start;active.value=active.value.slice(0,start)+text+active.value.slice(end);const pos=start+text.length;active.selectionStart=pos;active.selectionEnd=pos;active.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertText",data:text}));active.dispatchEvent(new Event("change",{bubbles:true}));active.focus();}else if(navigator.clipboard){navigator.clipboard.writeText(text);}})();`;
}

function setStatus(message) {
  statusNode.textContent = message;
}
