export const injectCustomJS = (view, id) => {
  const jsCode = `
    (function() {
      const log = (message) => {
        // console.log(message);
      };

      let observer;
      let isProcessing = false;
      let pendingUpdate = false;
      let shouldCancelProcessing = false;
      let namesListInterval;
      log('LinkedIn Customizer content script loaded in view ${id}');

      const dbName = 'ProfilesDB';
      const storeName = 'namesListStore';
      let previousNamesList = [];
      let dbConnection;

      // Inject CSS for reusable styling
      function injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = \`
          .role-tag-container {
            display: flex;
            align-items: center;
            backdrop-filter: blur(10px);
          }
          .role-span {
            border-radius: 0.5rem;
            padding: 3px 5px;
            font-size: 11px;
            font-weight: 700;
          }
          .id-tag {
            margin-left: 5px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
          }
        \`;
        document.head.appendChild(style);
      }

      // Open IndexedDB once and reuse the connection
      function openDB() {
        return new Promise((resolve, reject) => {
          if (dbConnection) {
            resolve(dbConnection);
            return;
          }
          const openDBRequest = indexedDB.open(dbName, 1);
          openDBRequest.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: 'id' });
            }
          };
          openDBRequest.onsuccess = function(event) {
            dbConnection = event.target.result;
            resolve(dbConnection);
          };
          openDBRequest.onerror = function(error) {
            reject('Failed to open IndexedDB:', error);
          };
        });
      }

      function updateNamesList() {
        log('Updating list');
        if (isProcessing) {
          pendingUpdate = true;
          shouldCancelProcessing = true;
          return;
        }
        isProcessing = true;
        shouldCancelProcessing = false;

        try {
          const namesList = previousNamesList || [];
          const ids = JSON.parse(localStorage.getItem('namesList')) || [];
          const ulElement = document.querySelector('ul.msg-conversations-container__conversations-list');
          
          if (ulElement) {
            let liElements = Array.from(ulElement.querySelectorAll('li'));
            const batchSize = 100;
            let index = 0;

            function processBatch() {
              if (shouldCancelProcessing) {
                log('Processing canceled');
                isProcessing = false;
                if (pendingUpdate) {
                  pendingUpdate = false;
                  updateNamesList();
                }
                return;
              }
              
              const fragment = document.createDocumentFragment(); // Batch DOM updates
              const batch = liElements.slice(index, index + batchSize);
              batch.forEach(li => {
                const nameTag = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
                if (nameTag) {
                  const name = nameTag.textContent.trim();
                  const participantNamesElement = li.querySelector('h3.msg-conversation-listitem__participant-names');
                  const matchedName = namesList.find(item => item.name === name);
                  let roleTagId = 'role-tag-' + name.replace(/\\s+/g, '-');
                  roleTagId = CSS.escape(roleTagId);
                  let existingRoleTag = li.querySelector(\`#\${roleTagId}\`);
                  li.style.display = 'block';

                  if (matchedName && (ids.some(id => id === matchedName.roleId) || ids.length === 0)) {
                    if (!existingRoleTag) {
                      const roleTagContainer = document.createElement('div');
                      roleTagContainer.id = roleTagId;
                      roleTagContainer.classList.add('role-tag-container'); // Use CSS classes for styling

                      const roleSpan = document.createElement('span');
                      roleSpan.textContent = matchedName.role;
                      roleSpan.classList.add('role-span');
                      roleSpan.style.backgroundColor = matchedName.bg;
                      roleSpan.style.color = matchedName.textColor;

                      const imgSpan = document.createElement('div');
                      imgSpan.classList.add('id-tag');
                      const code = matchedName.code;

                      imgSpan.style.backgroundColor = code && li.querySelector('img.presence-entity__image').src.includes(code) ? 'green' : 'orange';

                      roleTagContainer.appendChild(roleSpan);
                      roleTagContainer.appendChild(imgSpan);

                      const parentDiv = li.querySelector('.msg-conversation-card__content--selectable');
                      if (parentDiv) {
                        participantNamesElement.appendChild(roleTagContainer);
                        parentDiv.style.height = '110px';
                      }
                    } else {
                      existingRoleTag.style.display = 'flex';
                    }
                  } else if (existingRoleTag) {
                    li.style.display = ids.length > 0 ? 'none' : 'block';
                  } else {
                    li.style.display = ids.length > 0 ? 'none' : 'block';
                  }
                }
              });
              ulElement.appendChild(fragment); // Apply changes in one go

              index += batchSize;
              if (index < liElements.length) {
                requestAnimationFrame(processBatch); // Spread updates to prevent blocking
              } else {
                isProcessing = false;
                if (pendingUpdate) {
                  pendingUpdate = false;
                  updateNamesList();
                }
              }
            }
            processBatch();
          }
        } catch (e) {
          log(e);
        }
      }

      function findElementsAndStart() {
        const ulElement = document.querySelector('ul.msg-conversations-container__conversations-list');
        const titleRows = document.querySelectorAll('div.msg-conversations-container__title-row');

        if (ulElement || titleRows.length > 0) {
          log('Elements found, starting the script.');
          startScript();
        } else {
          log('Elements not found, retrying...');
          setTimeout(findElementsAndStart, 500); // Retry every 500ms
        }
      }

      function startScript() {
        clearInterval(namesListInterval);

        injectStyles(); // Inject CSS once

        updateNamesList();

        namesListInterval = setInterval(async () => {
          try {
            const db = await openDB();
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = function(event) {
              const currentNamesList = event.target.result.map(item => item.profile);
              if (JSON.stringify(currentNamesList) !== JSON.stringify(previousNamesList)) {
                log('Names List changed');
                previousNamesList = currentNamesList;
                pendingUpdate = true;
                updateNamesList();
              }
            };

            getAllRequest.onerror = function(error) {
              log('Failed to retrieve namesList from IndexedDB:', error);
            };
          } catch (error) {
            log('Error fetching names list:', error.message);
          }
        }, 5000); // Adjust interval to lower frequency

        // Check for changes in localStorage (debounced)
        let lastCheckedNamesList = JSON.parse(localStorage.getItem('namesList')) || [];
        const checkLocalStorage = setInterval(() => {
          try {
            const currentNamesList = JSON.parse(localStorage.getItem('namesList')) || [];
            if (JSON.stringify(currentNamesList) !== JSON.stringify(lastCheckedNamesList)) {
              log('LocalStorage namesList changed.');
              lastCheckedNamesList = currentNamesList;
              pendingUpdate = true;
              updateNamesList();
            }
          } catch (error) {
            console.error('Error checking localStorage namesList:', error);
          }
        }, 5000); // Debounced to every 5 seconds

        // Set up MutationObserver
        observer = new MutationObserver(debouncedUpdateNamesList);
        const ulElement = document.querySelector('ul.msg-conversations-container__conversations-list');
        const titleRows = document.querySelectorAll('div.msg-conversations-container__title-row');
        
        if (ulElement) {
          observer.observe(ulElement, {
            childList: true,
            subtree: true,
            attributes: false, // Disable unnecessary observation
          });
        }
        titleRows.forEach((titleRow) => {
          observer.observe(titleRow, {
            childList: true,
            subtree: false, // No need to observe deeply
          });
        });

        // Disconnect observer and clear intervals when done
        observer.disconnect = () => {
          clearInterval(checkLocalStorage);
          clearInterval(namesListInterval);
          log('Observer and intervals cleared');
        };
      }

      function debouncedUpdateNamesList() {
        clearTimeout(pendingUpdate);
        pendingUpdate = setTimeout(updateNamesList, 300); // Debounce updates
      }

      // Start the process
      findElementsAndStart();
    })();
  `;

  view
    .executeJavaScript(jsCode)
    .then(() => {
      // console.log(`Custom JS injected into WebView ${id}`);
    })
    .catch((err) =>
      console.error('Failed to inject custom JS into WebView ${id}:')

    );
};

export const injectTryGetAccountName = (view, id, changeName) => {
  const jsCode = `
      (function() {
        function tryGetAccountName() {
          // showLoadingScreen(); // Show loading screen
          const imgTag = document.querySelector("img.global-nav__me-photo");
          if (imgTag && imgTag.alt) {
            localStorage.setItem('name', imgTag.alt);
            customizeLinkedIn();
            hideLoadingScreen(); // Hide loading screen
            return imgTag.alt;
          } else {
            setTimeout(tryGetAccountName, 500);
            return null;
          }
        }
  
        function customizeLinkedIn() {
          try {
            const element1 = document.getElementById("main");
            if (element1) {
              element1.style.height = '100%';
              element1.style.width = '100%';
              element1.style.position = 'fixed';
              element1.style.margin = '0';
              element1.style.zIndex = '9999999999';
              element1.style.inset = '0';
              element1.style.background = 'white';
            }
            const element3 = document.querySelector('.app-loader--default');
            if(element3){
              element3.style.overflow = 'hidden';
            }
            const mainElement = document.querySelector('.msg-overlay-list-bubble');
            if (mainElement) {
              mainElement.style.display = 'none';
            }
          } catch (error) {
            // console.log('Error customizing LinkedIn: ' + error.message);
          }
        }
  
        function setupContinuousCustomization() {
          const observer = new MutationObserver(() => {
            customizeLinkedIn();
          });
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
          });
          customizeLinkedIn();
        }
  
        function setupUrlListener() {
          const observer = new MutationObserver(function() {
            if (!window.location.href.includes('/messaging/')) {
              showReturnToMessagesButton();
            } else {
              removeReturnToMessagesButton();
            }
          });
          observer.observe(document, { subtree: true, childList: true });
        }
  
        function showReturnToMessagesButton() {
          let button = document.getElementById('return-to-messages-button');
          if (!button) {
            button = document.createElement('button');
            button.id = 'return-to-messages-button';
            button.textContent = 'Get Back to Messages';
            button.style.position = 'fixed';
            button.style.top = '10px';
            button.style.right = '10px';
            button.style.zIndex = '90999900';
            button.style.padding = '10px 20px';
            button.style.backgroundColor = '#0073b1';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '5px';
            button.style.cursor = 'pointer';
  
            button.addEventListener('click', function() {
              window.location.href = 'https://www.linkedin.com/messaging/';
            });
  
            document.body.appendChild(button);
          }
        }
  
        function removeReturnToMessagesButton() {
          const button = document.getElementById('return-to-messages-button');
          if (button) {
            button.remove();
          }
        }

        function showLoadingScreen() {
          let loadingScreen = document.getElementById('loading-screen');
          if (!loadingScreen) {
            loadingScreen = document.createElement('div');
            loadingScreen.id = 'loading-screen';
            loadingScreen.style.position = 'fixed';
            loadingScreen.style.inset = '0';
            loadingScreen.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            loadingScreen.style.zIndex = '999999999';
            loadingScreen.style.display = 'flex';
            loadingScreen.style.flexDirection = 'column';
            loadingScreen.style.alignItems = 'center';
            loadingScreen.style.justifyContent = 'center';
            document.body.appendChild(loadingScreen);
          }
        }

        function hideLoadingScreen() {
          const loadingScreen = document.getElementById('loading-screen');
          if (loadingScreen) {
            loadingScreen.remove();
          }
        }

        localStorage.setItem('namesList', JSON.stringify([]));
        setupContinuousCustomization();
        return tryGetAccountName();
      })();
    `;

  view
    .executeJavaScript(jsCode)
    .then(() => {
      return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          view
            .executeJavaScript(
              `
              (function() {
                const name = localStorage.getItem('name');
                return name;
              })();
            `
            )
            .then((name) => {
              if (name) {
                clearInterval(interval);
                resolve(name);
              }
            })
            .catch((error) => {
              clearInterval(interval);
              reject(error);
            });
        }, 1000);
      });
    })
    .then((name) => {
      changeName({ id: id, newName: name });
    })
    .catch((error) => {
      console.error(`Failed to get account name for id ${id}: `, error);
    });
};

//   if (view && shortcuts) {
//     view.executeJavaScript(`
//       (function() {
//         console.log('Attempting to store shortcuts in IndexedDB');

//         const dbVersion = 3; // Use the existing version or a higher one
//         const request = indexedDB.open('ShortcutsDB', dbVersion); // Match the version to 3

//         request.onupgradeneeded = function(event) {
//           const db = event.target.result;
//           console.log('Upgrading database...');

//           // Create the object store if it doesn't exist
//           if (!db.objectStoreNames.contains('shortcuts')) {
//             db.createObjectStore('shortcuts', { keyPath: 'id' });
//             console.log('Object store "shortcuts" created.');
//           } else {
//             console.log('Object store "shortcuts" already exists.');
//           }
//         };

//         request.onsuccess = function(event) {
//           const db = event.target.result;
//           console.log('Database opened successfully:', db);

//           // Ensure object store exists before attempting a transaction
//           if (!db.objectStoreNames.contains('shortcuts')) {
//             console.error('Object store "shortcuts" not found.');
//             db.close();
//             return;
//           }

//           // Start a readwrite transaction to store shortcuts
//           const transaction = db.transaction('shortcuts', 'readwrite');
//           const store = transaction.objectStore('shortcuts');

//           // Clear existing shortcuts
//           const clearRequest = store.clear();

//           clearRequest.onsuccess = function() {
//             console.log('Old shortcuts cleared successfully.');

//             // Add new shortcuts
//             ${JSON.stringify(shortcuts)}.forEach((shortcut) => {
//               const addRequest = store.add(shortcut);
//               addRequest.onsuccess = function() {
//                 console.log('Shortcut added:', shortcut);
//               };
//               addRequest.onerror = function(event) {
//                 console.error('Failed to add shortcut:', event.target.error);
//               };
//             });
//           };

//           clearRequest.onerror = function(event) {
//             console.error('Failed to clear old shortcuts:', event.target.error);
//           };

//           transaction.oncomplete = function() {
//             console.log('All shortcuts stored successfully in IndexedDB.');
//           };

//           transaction.onerror = function(event) {
//             console.error('Transaction failed:', event.target.error);
//           };
//         };

//         request.onerror = function(event) {
//           console.error('Failed to open IndexedDB:', event.target.error);
//         };

//         request.onblocked = function() {
//           console.warn('Database open request is blocked. Please close other connections.');
//         };
//       })();
//     `)
//     .then(() => {
//       console.log('Shortcuts successfully injected and stored in IndexedDB');
//     })
//     .catch((err) => {
//       console.error('Failed to inject and store shortcuts in IndexedDB:', err);
//     });
//   }
// };
export const injectShortcutObserver = (view) => {
  if (view) {
    view.executeJavaScript(`
      (function() {
        console.log('Observing message box for input and fetching shortcuts from IndexedDB');

        let cachedShortcuts = []; // Cache to store shortcuts fetched from IndexedDB
        let pTagObserver; // Observer for <p> tag inside the message box

        function replaceName(text) {
          const name = getName();
          console.log('Replacing name in text:', text);
          return text.replace(/<<name>>/g, name);
        }

        function getName() {
          const nameElement = document.querySelector('h2.msg-entity-lockup__entity-title');
          const name = nameElement ? nameElement.textContent.trim() : "there";
          console.log('Fetched name:', name);
          return name;
        }

        // Function to show the filtered shortcut list
        function showShortcutList(filteredCommands) {
          try {
            const existingList = document.getElementById('shortcut-list');
            if (existingList) existingList.remove(); // Remove any existing list

            const list = document.createElement('ul');
            list.id = 'shortcut-list';
            list.style.position = 'absolute';
            list.style.backgroundColor = '#ffffff';
            list.style.padding = '10px 20px';
            list.style.listStyle = 'none';
            list.style.zIndex = '9999';
            list.style.borderRadius = '20px';
            list.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
            list.style.maxHeight = '150px';
            list.style.overflowY = 'auto';
            list.style.width = '360px';

            if (filteredCommands.length === 0) {
              const noCommandsItem = document.createElement('li');
              noCommandsItem.textContent = 'No commands available';
              noCommandsItem.style.padding = '8px 10px';
              noCommandsItem.style.color = '#777';
              list.appendChild(noCommandsItem);
            } else {
              filteredCommands.forEach((shortcut) => {
                const listItem = document.createElement('li');
                listItem.textContent = shortcut.title;
                listItem.style.padding = '8px 10px';
                listItem.style.cursor = 'pointer';
                listItem.style.borderBottom = '1px solid #ddd';

                listItem.addEventListener('click', () => {
                  try {
                    const messageBox = document.querySelector('.msg-form__contenteditable p');
                    if (messageBox) {
                      messageBox.textContent = replaceName(shortcut.content);

                      // Trigger input events for LinkedIn
                      ['input', 'keyup', 'keydown'].forEach(eventType => {
                        const event = new Event(eventType, { bubbles: true });
                        messageBox.dispatchEvent(event);
                      });
                    }
                    list.remove();
                  } catch (err) {
                    console.error('Failed to update message box:', err);
                  }
                });

                list.appendChild(listItem);
              });
            }

            document.body.appendChild(list);

            const messageBox = document.querySelector('.msg-form__contenteditable');
            const rect = messageBox.getBoundingClientRect();
            list.style.top = (rect.top - list.offsetHeight - 5) + 'px'; 
            list.style.left = (rect.left + (rect.width / 2) - (list.offsetWidth / 2)) + 'px';
          } catch (err) {
            console.error('Failed to show shortcut list:', err);
          }
        }

        // Function to fetch all shortcuts from IndexedDB
        function fetchShortcutsFromIndexedDB() {
          const dbVersion = 3; // Ensure this matches the highest version used
          const request = indexedDB.open('ShortcutsDB', dbVersion);

          request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('shortcuts')) {
              db.createObjectStore('shortcuts', { keyPath: 'id' });
              console.log('Object store "shortcuts" created.');
            }
          };

          request.onsuccess = function(event) {
            const db = event.target.result;
            console.log('Database opened successfully:', db);

            const transaction = db.transaction(['shortcuts'], 'readonly');
            const store = transaction.objectStore('shortcuts');
            const shortcuts = [];

            store.openCursor().onsuccess = function(event) {
              const cursor = event.target.result;
              if (cursor) {
                shortcuts.push(cursor.value);
                cursor.continue();
              } else {
                cachedShortcuts = shortcuts; // Update cached shortcuts
                console.log('Shortcuts fetched and cached:', cachedShortcuts);
              }
            };

            store.openCursor().onerror = function() {
              console.error('Failed to fetch shortcuts from IndexedDB');
            };
          };

          request.onerror = function(event) {
            console.error('Failed to open IndexedDB:', event);
          };
        }

        // Function to handle input changes in the message box
        function handleInputChanges(mutations) {
          try {
            mutations.forEach((mutation) => {
              if (mutation.type === 'characterData') {
                const inputText = mutation.target.textContent.trim();
                if (inputText === '') {
                  const existingList = document.getElementById('shortcut-list');
                  if (existingList) existingList.remove();
                  return;
                }

                if (inputText.startsWith('/')) {
                  const command = inputText.slice(1).trim().toLowerCase(); // Remove the '/' prefix and trim any spaces
                  console.log('Starts with /:', command);

                  const filteredCommands = command
                    ? cachedShortcuts
                        .filter(shortcut => shortcut.title.toLowerCase().startsWith(command))
                        .sort((a, b) => a.title.localeCompare(b.title)) // Sort alphabetically by title
                    : cachedShortcuts.sort((a, b) => a.title.localeCompare(b.title)); // Show all commands if no specific command is entered

                  showShortcutList(filteredCommands);
                }
                else {
                  const existingList = document.getElementById('shortcut-list');
                  if (existingList) existingList.remove();
                }
              }
            });
          } catch (err) {
            console.error('Failed to handle input changes:', err);
          }
        }

        // Function to add an observer to the <p> tag inside the message box
        function addObserver(pTag) {
          if (pTag) {
            // Disconnect previous observer if it exists
            if (pTagObserver) {
              pTagObserver.disconnect();
            }

            pTagObserver = new MutationObserver(handleInputChanges);
            pTagObserver.observe(pTag, { characterData: true, subtree: true });
            console.log('Observer added to <p> tag inside message box.');
          }
        }

        // Function to monitor the message box parent element for changes and re-add the observer if <p> is removed
        function monitorMessageBox() {
          const messageBox = document.querySelector('.msg-form__contenteditable');

          if (messageBox) {
            const observer = new MutationObserver(() => {
              const pTag = messageBox.querySelector('p');
              if (pTag) {
                console.log('Re-adding observer for <p> tag');
                addObserver(pTag); // Attach observer every time <p> is found
              } else {
                console.log('<p> tag removed, waiting to re-attach observer...');
                setTimeout(monitorMessageBox, 500); // Retry monitoring every 500ms if <p> tag is missing
              }
            });

            observer.observe(messageBox, { childList: true, subtree: true });
            console.log('Monitoring message box for changes to re-add <p> observer.');
          } else {
            console.log('Message box not found, retrying...');
            setTimeout(monitorMessageBox, 500); // Retry monitoring every 500ms if message box is missing
          }
        }

        // Function to monitor URL changes to re-check the message box when on messaging pages
        function monitorURLChanges() {
          let lastURL = location.href;
          new MutationObserver(() => {
            const currentURL = location.href;
            if (currentURL !== lastURL) {
              lastURL = currentURL;
              if (isMessagingPage()) {
                console.log('URL changed and is a messaging page, re-checking message box for <p> tag...');
                monitorMessageBox();
              } else {
                console.log('URL changed but not a messaging page, skipping observer setup.');
              }
            }
          }).observe(document, { subtree: true, childList: true });
        }

        // Check if the current page is a messaging page
        function isMessagingPage() {
          return window.location.href.includes('messaging');
        }

        // Set up a polling mechanism to fetch shortcuts from IndexedDB every 5 seconds
        setInterval(fetchShortcutsFromIndexedDB, 5000);

        // Check for the <p> tag every 500ms until found, then monitor it
        const checkInterval = setInterval(() => {
          if (isMessagingPage()) {
            const pTag = document.querySelector('.msg-form__contenteditable p');
            if (pTag) {
              addObserver(pTag);
              clearInterval(checkInterval);
              monitorMessageBox(); // Start monitoring the message box for changes
            }
          } else {
            console.log('Not on messaging page, skipping observer setup.');
          }
        }, 500);

        // Monitor URL changes to handle dynamic UI changes
        monitorURLChanges();

        // Hide the list when clicking outside
        document.addEventListener('click', (event) => {
          const list = document.getElementById('shortcut-list');
          if (list && !list.contains(event.target)) {
            list.remove();
            console.log('Shortcut list removed on outside click.');
          }
        });

        // Prevent showing the list multiple times
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') {
            const list = document.getElementById('shortcut-list');
            if (list) {
              list.remove();
              console.log('Shortcut list removed on Escape key press.');
            }
          }
        });

        // Fetch shortcuts initially
        fetchShortcutsFromIndexedDB();
      })();
    `)
    .then(() => {
      console.log('Observer injected to WebView for monitoring input');
    })
    .catch((err) => {
      console.error('Failed to inject observer:', err);
    });
  }
};
export const goToProfile = (view, accountId) => {
  const jsCode = `
    (function() {
      let buttonAdded = false;
      let attempts = 0;
      const maxAttempts = 10;
      let checkInterval;

      function addGoToProfileButton() {
        if (buttonAdded) return;

        const targetElement = document.querySelector('.scaffold-layout__detail.msg__detail');
        if (!targetElement) {
          attempts++;
          if (attempts >= maxAttempts) {
            console.log('Max attempts reached. Button not added.');
            clearInterval(checkInterval); // Stop the interval check if max attempts reached
            return;
          }
          console.log('Target element not found. Retrying...');
          return;
        }

        const goToProfileButton = document.createElement('button');
        goToProfileButton.className = 'go-to-profile-button';

        // Create SVG element
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 64 64");
        svg.setAttribute("width", "24");
        svg.setAttribute("height", "24");

        // Create paths
        const paths = [
          "M32 55.9C18.8 55.9 8.1 45.2 8.1 32S18.8 8.1 32 8.1 55.9 18.8 55.9 32 45.2 55.9 32 55.9zm0-45.2c-11.7 0-21.3 9.6-21.3 21.3S20.3 53.3 32 53.3 53.3 43.7 53.3 32 43.7 10.7 32 10.7z",
          "M32.5 45.7 18.8 32l13.7-13.7 1.8 1.9L22.6 32l11.7 11.8-1.8 1.9",
          "M20.7 30.6h24v2.8h-24z"
        ];

        paths.forEach(d => {
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", d);
          path.setAttribute("fill", "#134563");
          svg.appendChild(path);
        });

        // Add the SVG to the button
        goToProfileButton.appendChild(svg);

        Object.assign(goToProfileButton.style, {
          position: 'absolute',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: '9999',
          backgroundColor: '#0ea5e9',
          color: 'white',
          padding: '8px',
          borderRadius: '50%',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: 'none',
          cursor: 'pointer',
          width: '48px',
          height: '48px'
        });

        goToProfileButton.addEventListener('mouseover', () => {
          goToProfileButton.style.backgroundColor = '#0284c7';
          goToProfileButton.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        });

        goToProfileButton.addEventListener('mouseout', () => {
          goToProfileButton.style.backgroundColor = '#0ea5e9';
          goToProfileButton.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        });

        goToProfileButton.addEventListener('mousedown', () => {
          goToProfileButton.style.transform = 'translateY(-50%) scale(0.95)';
        });

        goToProfileButton.addEventListener('mouseup', () => {
          goToProfileButton.style.transform = 'translateY(-50%) scale(1)';
        });

        goToProfileButton.addEventListener('click', () => {
          const profileLink = document.querySelector('.msg-thread__link-to-profile');
          if (profileLink) {
            const profileUrl = profileLink.getAttribute('href');
            if (profileUrl) {
              window.electron.openProfile(profileUrl, '${accountId}');
            }
          }
        });

        targetElement.appendChild(goToProfileButton);
        buttonAdded = true;
        clearInterval(checkInterval); // Stop interval once the button is added
        console.log('Go to Profile button with arrow icon added successfully.');
      }

      // Initial call to add the button
      addGoToProfileButton();

      // Check every 5 seconds if the button is not added
      checkInterval = setInterval(() => {
        if (!buttonAdded) {
          addGoToProfileButton();
        }
      }, 5000);

      // MutationObserver to listen for changes in the UI
      const observer = new MutationObserver((mutations) => {
        if (!buttonAdded) {
          for (let mutation of mutations) {
            if (mutation.type === 'childList') {
              addGoToProfileButton();
              break;
            }
          }
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // Cleanup after 30 seconds to prevent unnecessary observations and checks
      setTimeout(() => {
        observer.disconnect();
        clearInterval(checkInterval); // Ensure the interval is cleared
        console.log('Observer and interval disconnected after 30 seconds.');
      }, 30000);
    })();
  `;

  view.executeJavaScript(jsCode)
    .then(() => console.log(`Custom JS injected into WebView ${accountId}`))
    .catch((err) => console.error(`Failed to inject custom JS into WebView ${accountId}:`, err));
};




export const injectProfileView = (view, id) => {
  const jsCode = `
      (function() {
        function customizeLinkedIn() {
          try {
            const element1 = document.querySelector("main.scaffold-layout__main");
            if (element1) {
              element1.style.height = '100%';
              element1.style.width = '100%';
              element1.style.position = 'fixed';
              element1.style.margin = '10px';
              element1.style.zIndex = '9999999999';
              element1.style.inset = '0';
              element1.style.background = 'white';
              element1.style.overflowY = 'scroll';
              element1.style.overflowX = 'hidden';
            }

            const element3 = document.querySelector('.app-loader--default');
            if(element3){
              element3.style.overflow = 'hidden';
            }

            const element2 = document.getElementById("global-nav");
            if(element2){
              element2.style.display = 'none';
            }
            const mainElement = document.querySelector('.msg-overlay-list-bubble');
            if (mainElement) {
              mainElement.style.display = 'none';
            }
          } catch (error) {
            // console.log('Error customizing LinkedIn: ' + error.message);
          }
        }
  
        function setupContinuousCustomization() {
          const observer = new MutationObserver(() => {
            customizeLinkedIn();
          });
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
          });
          customizeLinkedIn();
        }
        setupContinuousCustomization(); // Start observing and customizing continuously
      })();
    `;

  view
    .executeJavaScript(jsCode)
    .then((name) => {
      // console.log(`Account name for id ${id}: ${name}`);
    })
    .catch((error) => {
      console.error(`Failed to get account name for id ${id}: `, error);
    });
};
export const addLabel = (view, accountId) => {
  const jsCode = `
    (function() {
      // Function to handle keydown events
      function handleKeyDown(event) {
        // console.log('Keydown event detected:', event.key);
        // Check for Cmd+L (Mac) or Ctrl+L (Windows/Linux)
        if ((event.metaKey || event.ctrlKey) && event.key === 'l') {
          event.preventDefault(); // Prevent default browser action
          // console.log('Cmd+L or Ctrl+L pressed. Searching for active conversation...');
          checkActiveConversation();
        }
      }

      // Function to check for the active conversation and extract the image element and name
      function checkActiveConversation() {
        // Find the active conversation list item
        const activeLi = document.querySelector('.msg-conversations-container__convo-item-link--active');
        if (activeLi) {
          // console.log('Active conversation detected:', activeLi);
          const nameTag = activeLi.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
          // console.log(nameTag)
          if (nameTag) {
            const imgElement = activeLi.querySelector('img.presence-entity__image');
            const imgSrc = imgElement ? imgElement.src : null;

            const name = nameTag ? nameTag.textContent.trim() : null;

            // Send the data to the main process via Electron
            if (imgSrc && name) {
              window.electron.addLabel(imgSrc, '${accountId}', name);
            } else {
              // console.log('Name or image source not found.');
            }
          } else {
            // console.log('Anchor element not found in active conversation.');
          }
        } else {
          // console.log('No active conversation detected.');
        }
      }

      // Initialize the script and attach the event listeners
      // console.log('Initializing script...');
      // console.log('Attaching keydown event listener...');
      document.addEventListener('keydown', handleKeyDown);
    })();
  `;

  // Execute the JavaScript in the webview
  view
    .executeJavaScript(jsCode)
    .then(() => {
      // console.log("Custom JS injected successfully.");
    })
    .catch((err) => {
      console.error("Failed to inject custom JS:", err);
    });
};
//   if (view) {
//     view.executeJavaScript(`
//       (function() {
//         try {
//           const dbName = 'LabelsDB';
//           const storeName = 'codesStore';

//           // Open IndexedDB database
//           const request = indexedDB.open(dbName, 1);

//           request.onupgradeneeded = (event) => {
//             const db = event.target.result;
//             if (!db.objectStoreNames.contains(storeName)) {
//               db.createObjectStore(storeName, { keyPath: 'code' });
//             }
//           };

//           request.onsuccess = (event) => {
//             const db = event.target.result;
//             const transaction = db.transaction(storeName, 'readwrite');
//             const store = transaction.objectStore(storeName);

//             // Clear the existing store data
//             const clearRequest = store.clear();

//             clearRequest.onsuccess = () => {
//               // Store the new labels in the database
//               const codesArray = ${JSON.stringify(labels)}
//                 .map(label => ({
//                   code: label.code,
//                   codeName: label.codeName,
//                   labels: Array.isArray(label.labels) ? label.labels : []
//                 }));

//               codesArray.forEach(item => {
//                 const putRequest = store.put(item);

//                 putRequest.onsuccess = () => {
//                   console.log('Code stored successfully:', item);
//                 };

//                 putRequest.onerror = (error) => {
//                   console.error('Error storing code:', error);
//                 };
//               });
//             };

//             clearRequest.onerror = (error) => {
//               console.error('Failed to clear existing data:', error);
//             };

//             transaction.oncomplete = () => {
//               console.log('IndexedDB updated with new labels');
//             };

//             transaction.onerror = (error) => {
//               console.error('Failed to update IndexedDB:', error);
//             };
//           };

//           request.onerror = (error) => {
//             console.error('Failed to open IndexedDB:', error);
//           };

//         } catch (error) {
//           console.error('Error updating labels:', error);
//         }
//       })();
//     `)
//       .then(() =>
//         console.log(
//           `Updated labels in IndexedDB for WebView ${view.getAttribute(
//             "data-id"
//           )}`
//         )
//       )
//       .catch((err) =>
//         console.error(
//           `Failed to update labels for WebView ${view.getAttribute(
//             "data-id"
//           )}:`,
//           err
//         )
//       );
//   }
// };
export const updateLabelTags = (view) => {
  if (view) {
    view.executeJavaScript(`
      (function() {
        const dbName = 'LabelsDB';
        const storeName = 'codesStore';
        let labelCache = {}; // Local cache for IndexedDB data
        let observer; // To observe changes in the UI
        let dbChangeObserver; // To observe changes in the DB
        let isProcessing = false; // Flag to indicate if the function is currently processing
        let pendingUpdate = false; // Flag to handle pending updates

        // Initialize the IndexedDB and cache label data
        function initIndexedDB() {
          const request = indexedDB.open(dbName, 1);

          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: 'code' });
            }
          };

          request.onsuccess = (event) => {
            const db = event.target.result;
            loadLabelsFromDB(db); // Preload all label data into cache
            observeUIChanges(); // Start observing changes in the broader UI
            observeDBChanges(db); // Start observing changes in the IndexedDB
          };

          request.onerror = (error) => {
            console.error('Failed to open IndexedDB:', error);
          };
        }

        // Load all label data from IndexedDB into cache
        function loadLabelsFromDB(db) {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const getAllRequest = store.getAll();

          getAllRequest.onsuccess = (event) => {
            labelCache = event.target.result.reduce((acc, labelData) => {
              acc[labelData.code] = labelData;
              return acc;
            }, {});
            updateLiElements(); // Update the UI initially with cached data
          };

          getAllRequest.onerror = (error) => {
            console.error('Failed to load labels from IndexedDB:', error);
          };
        }

        // Throttle function to limit how often updateLiElements is called
        function throttle(func, delay) {
          let lastCall = 0;
          return (...args) => {
            const now = new Date().getTime();
            if (now - lastCall >= delay) {
              lastCall = now;
              return func(...args);
            }
          };
        }

        // Observe changes in the entire UI, not just specific elements
        function observeUIChanges() {
          stopObserver(); // Stop any existing observer before starting a new one
          const targetElement = document.body; // Observe the entire body for broader monitoring

          observer = new MutationObserver(throttle((mutations) => {
            if (isProcessing) {
              pendingUpdate = true; // Flag that an update is pending
              return;
            }
            
            // Check if any relevant UI changes occurred
            if (mutations.some(mutation => mutation.type === 'childList' || mutation.type === 'attributes')) {
              updateLiElements(); // Update the UI with new data
            }
          }, 500)); // Throttle updates to 500ms

          observer.observe(targetElement, {
            childList: true, // Observe direct child changes
            subtree: true,   // Observe all descendants of the target
            attributes: true, // Observe attribute changes
            characterData: true // Observe character data changes
          });
        }

        // Observe changes in the IndexedDB
        function observeDBChanges(db) {
          if (dbChangeObserver) {
            clearInterval(dbChangeObserver);
          }

          // Check the IndexedDB for changes every second
          dbChangeObserver = setInterval(() => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = (event) => {
              const currentData = event.target.result.reduce((acc, labelData) => {
                acc[labelData.code] = labelData;
                return acc;
              }, {});

              // If data has changed, update the UI
              if (JSON.stringify(currentData) !== JSON.stringify(labelCache)) {
                labelCache = currentData;
                updateLiElements();
              }
            };

            getAllRequest.onerror = (error) => {
              console.error('Failed to check for changes in IndexedDB:', error);
            };
          }, 1000); // Interval set to 1 second
        }

        // Stop the existing observer
        function stopObserver() {
          if (observer) {
            observer.disconnect();
            observer = null;
          }
        }

        // Update <li> elements with labels from the cache
        function updateLiElements() {
          if (isProcessing) {
            pendingUpdate = true; // If already processing, set a pending update
            return;
          }
          isProcessing = true;

          const liElements = document.querySelectorAll('ul.msg-conversations-container__conversations-list > li');

          liElements.forEach(li => {
            clearExistingTags(li); // Clear all existing tags before processing
            const anchorElement = li.querySelector('a.msg-conversation-listitem__link');
            const imgElement = anchorElement ? anchorElement.querySelector('img.presence-entity__image') : null;
            const imgSrc = imgElement ? imgElement.src : null;
            const nameTag = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');

            if (imgSrc && nameTag) {
              const nameContent = nameTag.textContent.trim();
              const labelData = labelCache[imgSrc]; // Get label data from cache

              if (labelData && labelData.codeName === nameContent) {
                addLabelsToContent(li, labelData); // Add the labels directly to the content div within the <li> element
              }
            }
          });

          isProcessing = false; // Reset the processing flag

          // If an update is pending, run the function again
          if (pendingUpdate) {
            pendingUpdate = false; // Reset the pending flag
            updateLiElements();
          }
        }

        // Clear all existing label tags from the <li> element
        function clearExistingTags(li) {
          const existingTags = li.querySelectorAll('[id^="label-tag-"]');
          existingTags.forEach(tag => tag.remove());
        }

        // Add multiple labels to the content div within the <li> element
        function addLabelsToContent(li, labelData) {
          const parentDiv = li.querySelector('h3.msg-conversation-listitem__participant-names');
          const parent = li.querySelector('.msg-conversation-card__content--selectable');
          
          if (!parentDiv) return;

          const roleTagContainerId = \`label-tag-\${labelData.code}\`;
          let roleTagContainer = parentDiv.querySelector(\`#\${CSS.escape(roleTagContainerId)}\`);

          // Remove existing role tag container if it exists
          if (roleTagContainer) {
            roleTagContainer.remove();
          }

          // Recreate the role tag container
          roleTagContainer = document.createElement('div');
          roleTagContainer.id = roleTagContainerId;
          roleTagContainer.style.display = 'flex';
          roleTagContainer.style.alignItems = 'center';
          roleTagContainer.style.gap = '5px';
          // roleTagContainer.style.position = 'absolute';
          // roleTagContainer.style.bottom = '5px';
          roleTagContainer.style.textTransform = 'uppercase';

          // Append the roleTagContainer to the parentDiv
          parentDiv.prepend(roleTagContainer);

          // Iterate over the labels and add them directly within the roleTagContainer
          labelData.labels.forEach(label => {
            const roleSpanContainer = document.createElement('div');
            roleSpanContainer.style.display = 'flex';
            roleSpanContainer.style.alignItems = 'center';
            roleSpanContainer.style.padding = '2px 4px';
            roleSpanContainer.style.borderRadius = '3px';
            roleSpanContainer.style.backgroundColor = label.color;
            roleSpanContainer.style.color = 'white';
            roleSpanContainer.style.fontSize = '8px';

            const roleSpan = document.createElement('span');
            roleSpan.textContent = label.name;

            roleSpanContainer.appendChild(roleSpan);

            // Append the roleSpanContainer directly within the roleTagContainer inside the <li>
            roleTagContainer.appendChild(roleSpanContainer);
            parent.style.height='110px';
          });

          // Append the roleTagContainer to the <li> if not already attached
          if (!li.querySelector('h3.msg-conversation-listitem__participant-names').contains(roleTagContainer)) {
            li.querySelector('h3.msg-conversation-listitem__participant-names').prepend(roleTagContainer);
            parent.style.height='110px';
          }
        }

        // Initialize the IndexedDB and set up observers
        initIndexedDB();
      })();
    `)
      .then(() =>
        console.log(
          `Started monitoring and updating labels in WebView ${view.getAttribute(
            "data-id"
          )}`
        )
      )
      .catch((err) =>
        console.error(
          `Failed to update labels for WebView ${view.getAttribute(
            "data-id"
          )}:`,
          err
        )
      );
  }
};
export const scriptTo = (view) => {
  if (view) {
    view.executeJavaScript(`
      (function() {
        // Function to check for the "Archive" list item and click it
        function checkAndClickArchive() {
          function pollForUl() {
            const activeConversation = document.querySelector('.msg-conversations-container__convo-item-link--active');
            if (activeConversation) {
              const inboxShortcuts = activeConversation.nextElementSibling.querySelector('.msg-thread-actions__dropdown-options--inbox-shortcuts');
              
              if (inboxShortcuts) {
                const children = inboxShortcuts.querySelector('.artdeco-dropdown__content-inner');
                const ul = children.getElementsByTagName('ul')[0];
                if (ul) {
                  
                    const archiveItem = Array.from(ul.querySelectorAll('div')).find(item => 
                      item.textContent.includes('Archive')
                      );
                    
                    if (archiveItem) {
                      archiveItem.click();
                      console.log('Archive item clicked');
                    } else {
                      console.log('Archive item not found');
                    }
                }
                else{
                setTimeout(pollForUl, 1000);
                }
              } else {
                console.log('Inbox shortcuts not found');
                setTimeout(pollForUl, 1000);
              }
            } else {
              console.log('Active conversation not found');
            }
            // Poll again after a delay
            
          }

          pollForUl();  // Start polling for the "Archive" item
        }

        // Function to continuously check for the active conversation and click the button
        function checkAndClick() {
          const activeConversation = document.querySelector('.msg-conversations-container__convo-item-link--active');
          if (activeConversation) {
            console.log('Active conversation found');

            const button = activeConversation.nextElementSibling.querySelector('button.msg-thread-actions__control');
            button.nextElementSibling.style.opacity = '0';
            if (button) {
              button.click();  // Open the dropdown
              console.log('Button clicked');
              setTimeout(checkAndClickArchive, 500);  // Delay to allow dropdown to appear
            } else {
              console.log('Button not found');
            }
            
            return true;  // Stop checking once the active conversation is found and button is clicked
          }

          return false;  // Active conversation not yet found
        }

        // Function to handle keyboard shortcuts
        function handleKeyboardEvent(event) {
          if (event.metaKey && event.shiftKey && event.code === 'KeyA') {
            console.log('Cmd + Shift + A pressed');
            checkAndClick();  // Trigger the action on keyboard shortcut
          }
        }

        // Add a global keyboard event listener
        document.addEventListener('keydown', handleKeyboardEvent);

        console.log('Keyboard event listener added for Cmd + Shift + A');
      })();
    `).then(() => {
      console.log('Script with keyboard shortcut listener injected');
    }).catch((err) => {
      console.error('Failed to inject script with keyboard shortcut listener:', err);
    });
  }
}
export const injectStayOnMessagingPage = (view) => {
  const jsCode = `
    (function() {
      // Function to show the "Get Back to Message Page" button
      function showReturnToMessagesButton() {
        let button = document.getElementById('return-to-messages-button');
        if (!button) {
          button = document.createElement('button');
          button.id = 'return-to-messages-button';
          button.textContent = 'Get Back to Message Page';
          button.style.position = 'fixed';
          button.style.bottom = '20px';
          button.style.right = '20px';
          button.style.zIndex = '999999';
          button.style.padding = '10px 20px';
          button.style.backgroundColor = '#0073b1'; // LinkedIn sky blue color
          button.style.color = 'white';
          button.style.border = 'none';
          button.style.borderRadius = '5px';
          button.style.cursor = 'pointer';
          button.style.fontSize = '14px';
          button.style.boxShadow = '0px 4px 8px rgba(0, 0, 0, 0.1)';
  
          button.addEventListener('click', function() {
            window.location.href = 'https://www.linkedin.com/messaging/';
          });

          document.body.appendChild(button);
        }
      }

      // Function to hide the "Get Back to Message Page" button when on messaging page
      function hideReturnToMessagesButton() {
        const button = document.getElementById('return-to-messages-button');
        if (button) {
          button.remove();
        }
      }

      // Function to check the current URL and show or hide the button accordingly
      function checkPage() {
        if (!window.location.href.includes('/messaging/')) {
          showReturnToMessagesButton();
        } else {
          hideReturnToMessagesButton();
        }
      }

      // Observe URL changes to show/hide the button
      function observeUrlChanges() {
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function() {
          originalPushState.apply(history, arguments);
          checkPage();
        };

        history.replaceState = function() {
          originalReplaceState.apply(history, arguments);
          checkPage();
        };

        window.addEventListener('popstate', checkPage);
      }

      // Initial setup
      checkPage();
      observeUrlChanges();
    })();
  `;

  view.executeJavaScript(jsCode)
    .catch((error) => {
      console.error('Failed to inject stay-on-messaging-page code:', error);
    });
};
export const injectCandidateEvaluation = (view) => {
  view.executeJavaScript(`
    (function() {
      // Function to simulate API calls with a delay (5 seconds)
      const simulateApiCall = (callback) => {
        setTimeout(() => {
          callback(true);  // Simulate successful API response
        }, 5000);  // 5-second delay
      };

      // Function to inject the evaluation card
      const injectCandidateEvaluationCard = () => {
        // Check if the card already exists by its ID
        if (document.getElementById('evaluationContainer')) {
          console.log('Evaluation card already exists. Skipping injection.');
          return;
        }

        // Inject CSS styles for the card
        const style = document.createElement('style');
        style.textContent = \`
          .evaluation-card {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 100%;
            max-width: 400px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            padding: 24px;
            text-align: center;
            z-index: 9999999;
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.5s ease, transform 0.5s ease;
          }
          .evaluation-card.show {
            opacity: 1;
            transform: translateY(0);
          }
          .evaluation-button {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 4px;
            color: white;
            transition: background-color 0.3s ease, transform 0.3s ease;
          }
          .yes-button { background-color: rgba(76, 175, 80, 1); }
          .maybe-button { background-color: rgba(240, 173, 78, 1); }
          .no-button { background-color: rgba(217, 83, 79, 1); }
          .reset-button { background-color: rgba(33, 150, 243, 1); }
          .evaluation-button:hover {
            transform: scale(1.05);
          }
          h2 { font-size: 24px; margin-bottom: 16px; }
          p {
            margin-bottom: 24px;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.5s ease, transform 0.5s ease;
          }
          p.show {
            opacity: 1;
            transform: translateY(0);
          }
          .loader {
            display: inline-block;
            width: 24px;
            height: 24px;
            border: 3px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top-color: #333;
            animation: spin 1s ease-in-out infinite;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        \`;
        document.head.appendChild(style);

        // Create the evaluation card container
        const card = document.createElement('div');
        card.className = 'evaluation-card';
        card.id = 'evaluationContainer';  // Unique ID for the evaluation card
        card.innerHTML = \`
          <h2>Candidate Evaluation</h2>
          <p id="evaluationText"></p>
          <div id="buttonsContainer" class="buttons"></div>
          <div id="loading" style="display: none;"><div class="loader"></div></div>
        \`;
        document.body.appendChild(card);

        // Show the card with a fade-in animation
        setTimeout(() => {
          card.classList.add('show');
        }, 100);

        const evaluationTexts = [
          "Hey there! Ready for a performance evaluation?",
          "Before we roll out the red carpet, how about a quick evaluation?",
          "Think of it as a game show! Will you evaluate this candidate?",
          "It's evaluation time! Are you ready to weigh in?",
          "Your opinion matters! Ready to evaluate?"
        ];

        const yesTexts = [
          "Fantastic! The profile has been evaluated! 🎉",
          "You said yes! The profile is now officially evaluated.",
          "Great choice! The profile is now evaluated.",
          "Yes! The profile has been evaluated.",
          "You did it! The profile is now evaluated."
        ];

        const maybeTexts = [
          "Hmm, a maybe! The profile will be put on hold.",
          "Maybe it's time for a second look!",
          "You've chosen maybe! This profile is in limbo.",
          "A maybe? Sounds like a sequel is in the works!",
          "Maybe means we're still in the game!"
        ];

        const noTexts = [
          "No? That's a hard pass! Let's chat about other roles!",
          "A no it is! But could they fit another role?",
          "Not this time! Let's brainstorm other roles.",
          "A no! But don't worry; we'll find a role that suits them!",
          "You've decided no! Let's explore other roles!"
        ];

        const evaluationTextElement = document.getElementById('evaluationText');
        const buttonsContainer = document.getElementById('buttonsContainer');
        const loadingIndicator = document.getElementById('loading');

        let stage = 'evaluation';

        // Function to update the evaluation text with animation
        const setTextWithAnimation = (text) => {
          evaluationTextElement.classList.remove('show');
          setTimeout(() => {
            evaluationTextElement.innerText = text;
            evaluationTextElement.classList.add('show');
          }, 300);  // Small delay for smoother transition
        };

        // Set initial evaluation text
        setTextWithAnimation(evaluationTexts[Math.floor(Math.random() * evaluationTexts.length)]);

        // Function to create the buttons
        const createButtons = () => {
          buttonsContainer.innerHTML = '';  // Clear previous buttons
          if (stage === 'evaluation') {
            ['yes', 'maybe', 'no'].forEach(choice => {
              const button = document.createElement('button');
              button.className = 'evaluation-button ' + choice + '-button';
              button.innerText = choice.charAt(0).toUpperCase() + choice.slice(1);
              button.onclick = () => handleEvaluation(choice);
              buttonsContainer.appendChild(button);
            });
          } else {
            const resetButton = document.createElement('button');
            resetButton.className = 'evaluation-button reset-button';
            resetButton.innerText = 'Evaluate Next Candidate';
            resetButton.onclick = resetEvaluation;
            buttonsContainer.appendChild(resetButton);
          }
        };

        // Function to handle evaluation
        const handleEvaluation = (choice) => {
          stage = 'loading';
          buttonsContainer.style.display = 'none';
          loadingIndicator.style.display = 'block';

          simulateApiCall(() => {
            loadingIndicator.style.display = 'none';
            buttonsContainer.style.display = 'block';
            stage = 'result';
            switch (choice) {
              case 'yes':
                setTextWithAnimation(yesTexts[Math.floor(Math.random() * yesTexts.length)]);
                break;
              case 'maybe':
                setTextWithAnimation(maybeTexts[Math.floor(Math.random() * maybeTexts.length)]);
                break;
              case 'no':
                setTextWithAnimation(noTexts[Math.floor(Math.random() * noTexts.length)]);
                break;
            }
            createButtons();  // Update buttons for the next candidate
          });
        };

        // Function to reset the evaluation
        const resetEvaluation = () => {
          stage = 'evaluation';
          setTextWithAnimation(evaluationTexts[Math.floor(Math.random() * evaluationTexts.length)]);
          createButtons();  // Reset buttons for evaluation
        };

        createButtons();  // Initial button creation
      };

      // Function to check for profile element and inject the evaluation card
      const checkForProfileClass = setInterval(() => {
        const profileClassElement = document.querySelector('.profile-background-image');
        
        if (profileClassElement) {
          clearInterval(checkForProfileClass);  // Stop checking once the class is found
          injectCandidateEvaluationCard();  // Inject the evaluation card
        }
      }, 1000);  // Check every second
    })();
  `);
};
export const interceptAnchorClicks = (view, sheet) => {
  if (view) {
    view.executeJavaScript(`
      // Function to attach click event listeners to all anchor tags
      const attachAnchorListeners = () => {
        document.querySelectorAll('a').forEach(anchor => {
          if (!anchor.hasAttribute('data-listener-added')) {
            anchor.addEventListener('click', function(event) {
              event.preventDefault(); // Stop the default navigation behavior
              const url = anchor.href; // Get the clicked link's URL

              // Send the URL and sheet info to Electron
              window.electron.openUrlFromSheet(url, ${JSON.stringify(sheet)});
            });

            // Mark this anchor to avoid adding duplicate listeners
            anchor.setAttribute('data-listener-added', 'true');
          }
        });
      };

      // Run the function initially to intercept existing anchors
      attachAnchorListeners();

      // Set up a MutationObserver to watch for changes in the DOM
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.addedNodes.length > 0) {
            attachAnchorListeners(); // Attach listeners to new anchor elements
          }
        });
      });

      // Observe changes in the entire document
      observer.observe(document.body, {
        childList: true, // Observe direct children changes
        subtree: true    // Observe all descendant nodes as well
      });
    `);
  }
};



export const executeInView = (view, script, successMessage, errorMessage) => {
  if (view) {
    view
      .executeJavaScript(script)
      .then(() => console.log(successMessage))
      .catch((err) => console.error(errorMessage, err));
  }
};

const getIndexedDBScript = (dbName, storeName, version = 1, operation) => `
  (function() {
    try {
      const request = indexedDB.open('${dbName}', ${version});

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('${storeName}')) {
          db.createObjectStore('${storeName}', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        ${operation}
      };

      request.onerror = (error) => {
        console.error('Failed to open IndexedDB:', error);
      };
    } catch (error) {
      console.error('Error performing IndexedDB operation:', error);
    }
  })();
`;

export const updateRoles = (selectedProfiles, view) => {
  const namesArray = JSON.stringify(
    selectedProfiles.map((profile, index) => ({ id: index, profile }))
  );

  const operation = `
    const transaction = db.transaction('namesListStore', 'readwrite');
    const store = transaction.objectStore('namesListStore');
    store.clear().onsuccess = () => {
      ${namesArray}.forEach(item => store.add(item));
    };
  `;
  
  const script = getIndexedDBScript('ProfilesDB', 'namesListStore', 1, operation);
  executeInView(view, script, 'Updated namesList in IndexedDB', 'Failed to update namesList');
};

export const updateList = (checkedItems, view) => {
  const itemsToStore = Array.isArray(checkedItems) ? checkedItems : [checkedItems];
  const script = `
    localStorage.setItem('namesList', JSON.stringify(${JSON.stringify(itemsToStore)}));
  `;
  
  executeInView(view, script, 'Updated namesList in localStorage', 'Failed to update namesList');
};

export const clearAllIndexedDBs = (view) => {
  const script = `
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        const request = indexedDB.deleteDatabase(db.name);
        request.onsuccess = () => console.log('IndexedDB database "' + db.name + '" cleared successfully.');
        request.onerror = (event) => console.error('Failed to clear IndexedDB "' + db.name + '":', event.target.error);
      });
    }).catch(error => console.error('Error fetching databases:', error));
  `;

  executeInView(view, script, 'Cleared all IndexedDB databases', 'Failed to clear IndexedDBs');
};

export const storeShortcutsInIndexedDB = (view, shortcuts) => {
  const shortcutsArray = JSON.stringify(shortcuts);
  const operation = `
    const transaction = db.transaction('shortcuts', 'readwrite');
    const store = transaction.objectStore('shortcuts');
    store.clear().onsuccess = () => {
      ${shortcutsArray}.forEach(shortcut => store.add(shortcut));
    };
  `;
  
  const script = getIndexedDBScript('ShortcutsDB', 'shortcuts', 3, operation);
  executeInView(view, script, 'Stored shortcuts in IndexedDB', 'Failed to store shortcuts');
};

export const updateLabels = (labels, view) => {
  const labelsArray = JSON.stringify(
    labels.map(label => ({
      code: label.code,
      codeName: label.codeName,
      labels: Array.isArray(label.labels) ? label.labels : []
    }))
  );
  
  const operation = `
    const transaction = db.transaction('codesStore', 'readwrite');
    const store = transaction.objectStore('codesStore');
    store.clear().onsuccess = () => {
      ${labelsArray}.forEach(label => store.put(label));
    };
  `;
  
  const script = getIndexedDBScript('LabelsDB', 'codesStore', 1, operation);
  executeInView(view, script, 'Updated labels in IndexedDB', 'Failed to update labels');
};


export const monitorDomChanges = (view) => {
  const jsCode = `
    (function() {
      // Function to handle and print mutation changes
      function printDomChanges(mutations) {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            // When nodes are added
            if (mutation.addedNodes.length > 0) {
              mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Only element nodes
                  console.log('Added Element:', node);
                  console.log(node.outerHTML);
                }
              });
            }

            // When nodes are removed
            if (mutation.removedNodes.length > 0) {
              mutation.removedNodes.forEach(node => {
                if (node.nodeType === 1) { // Only element nodes
                  console.log('Removed Element:', node);
                  console.log(node.outerHTML);
                }
              });
            }
          }

          if (mutation.type === 'attributes') {
            // When attributes of an element are changed
            console.log('Modified Attribute on Element:', mutation.target);
            console.log('Attribute Changed:', mutation.attributeName);
            console.log(mutation.target.outerHTML);
          }
        });
      }

      // Create a MutationObserver instance
      const observer = new MutationObserver(printDomChanges);

      // Start observing the whole document for changes
      observer.observe(document.body, {
        childList: true,  // Watch for added/removed nodes
        attributes: true, // Watch for attribute changes
        subtree: true,    // Observe changes in all descendants
      });

      console.log('DOM monitoring has started');
    })();
  `;

  // Inject and execute the script into the webview
  view
    .executeJavaScript(jsCode)
    .then(() => {
      // Script successfully injected
      console.log('DOM monitoring script injected successfully.');
    })
    .catch((err) => {
      // Handle errors in injection
      console.error('Failed to inject DOM monitoring script:', err);
    });
};

