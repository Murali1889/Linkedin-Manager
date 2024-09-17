export const updateRoles = (selectedProfiles, view) => {
  const namesList = selectedProfiles;
  if (view) {
    view
      .executeJavaScript(
        `
              (function() {
                try {
                  const dbName = 'ProfilesDB';
                  const storeName = 'namesListStore';
    
                  // Open IndexedDB database
                  const request = indexedDB.open(dbName, 1);
    
                  request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(storeName)) {
                      db.createObjectStore(storeName, { keyPath: 'id' });
                    }
                  };
    
                  request.onsuccess = (event) => {
                    const db = event.target.result;
                    const transaction = db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
    
                    // Clear existing store
                    store.clear().onsuccess = () => {
                      const namesArray = ${JSON.stringify(
          namesList
        )}.map((profile, index) => ({ id: index, profile }));
                      namesArray.forEach(item => store.add(item));
                    };
    
                    transaction.oncomplete = () => {
                      // console.log('IndexedDB updated with namesList in WebView');
                    };
    
                    transaction.onerror = (error) => {
                      console.error('Failed to update IndexedDB in WebView:', error);
                    };
                  };
    
                  request.onerror = (error) => {
                    console.error('Failed to open IndexedDB in WebView:', error);
                  };
                } catch (error) {
                  console.error('Error updating roles:', error);
                }
              })();
            `
      )
      .then(() =>
        console.log(
          `Updated namesList in IndexedDB for WebView ${view.getAttribute(
            "data-id"
          )}`
        )
      )
      .catch((err) =>
        console.error(
          `Failed to update namesList for WebView ${view.getAttribute(
            "data-id"
          )}:`,
          err
        )
      );
  }
};
export const updateList = (checkedItems, view) => {
  if (view) {
    view
      .executeJavaScript(
        `
              (function() {
                try {
                  // Convert the checked items to an array if not already
                  const itemsToStore = Array.isArray(${JSON.stringify(
          checkedItems
        )}) ? ${JSON.stringify(checkedItems)} : [${JSON.stringify(
          checkedItems
        )}];
                  
                  // Store the checked items in localStorage under 'namesList'
                  localStorage.setItem('namesList', JSON.stringify(itemsToStore));
                  // console.log('namesList updated in localStorage with checked items:', itemsToStore);
                } catch (error) {
                  console.error('Failed to update namesList in localStorage:', error);
                }
              })();
            `
      )
      .then(() =>
        console.log(
          `Updated namesList in localStorage for WebView ${view.getAttribute(
            "data-id"
          )}`
        )
      )
      .catch((err) =>
        console.error(
          `Failed to update namesList for WebView ${view.getAttribute(
            "data-id"
          )}:`,
          err
        )
      );
  }
};

export const injectCustomJS = (view, id) => {
  const jsCode = `
    (function() {
      const log = (message) => {
        // console.log(message);
      };
      let namesListInterval;
      let observer;
      let isProcessing = false;
      let pendingUpdate = false;
      let shouldCancelProcessing = false;
      log('LinkedIn Customizer content script loaded in view ${id}');

      const dbName = 'ProfilesDB';
      const storeName = 'namesListStore';
      let previousNamesList = [];

      const openDBRequest = indexedDB.open(dbName, 1);

      openDBRequest.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      };

      openDBRequest.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = function(event) {
          previousNamesList = event.target.result.map(item => item.profile);
          findElementsAndStart(); // Start searching for the elements
        };

        getAllRequest.onerror = function(error) {
          console.error('Failed to retrieve namesList from IndexedDB:', error);
        };
      };

      openDBRequest.onerror = function(error) {
        console.error('Failed to open IndexedDB:', error);
      };

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
              const batch = liElements.slice(index, index + batchSize);
              batch.forEach(li => {
                const nameTag = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
                if (nameTag) {
                  const name = nameTag.textContent.trim();
                  const matchedName = namesList.find(item => item.name === name);
                  let roleTagId = 'role-tag-' + name.replace(/\\s+/g, '-');
                  roleTagId = CSS.escape(roleTagId);
                  // console.log(\`#\${roleTagId}\`);
                  let existingRoleTag = li.querySelector(\`#\${roleTagId}\`);
                  li.style.display = 'block';
                  if (matchedName && (ids.some(id => id === matchedName.roleId) || ids.length === 0)) {
                    if (!existingRoleTag) {
                      const roleTagContainer = document.createElement('div');
                      roleTagContainer.id = roleTagId;
                      roleTagContainer.style.display = 'flex';
                      roleTagContainer.style.alignItems = 'center';
                      roleTagContainer.classList.add('role-tag-container');

                      const roleSpan = document.createElement('span');
                      roleSpan.textContent = matchedName.role;
                      roleSpan.style.borderRadius = '5px';
                      roleSpan.style.backgroundColor = matchedName.bg;
                      roleSpan.style.color = matchedName.textColor;
                      roleSpan.style.padding = '3px 5px';
                      roleSpan.style.fontSize = '12px';
                      roleSpan.style.marginRight = '5px';

                      const idSpan = document.createElement('span');
                      idSpan.textContent = matchedName.id;
                      idSpan.style.marginLeft = '5px';
                      idSpan.style.backgroundColor = matchedName.textColor;
                      idSpan.style.color = matchedName.bg;
                      idSpan.style.padding = '3px 5px';
                      idSpan.style.borderRadius = '5px';
                      idSpan.style.fontSize = '12px';
                      idSpan.style.marginRight = '5px';

                      const imgSpan = document.createElement('div');
                      imgSpan.classList.add('id-tag');
                      imgSpan.style.marginLeft = '5px';
                      imgSpan.style.width = '10px';
                      imgSpan.style.height = '10px';
                      imgSpan.style.borderRadius = '50%';

                      const code = matchedName.code;
                      if (code) {
                        const anchorElement = li.querySelector('a.msg-conversation-listitem__link');
                        const imgElement = anchorElement.querySelector('img.presence-entity__image');
                        if (imgElement && imgElement.src.includes(code)) {
                          imgSpan.style.backgroundColor = 'green';
                        } else {
                          imgSpan.style.backgroundColor = 'orange';
                        }
                      } else {
                        imgSpan.style.backgroundColor = 'orange';
                      }

                      roleTagContainer.appendChild(roleSpan);
                      roleTagContainer.appendChild(idSpan);
                      roleTagContainer.appendChild(imgSpan);

                      const parentDiv = li.querySelector('.msg-conversation-card__content--selectable');
                      if (parentDiv) {
                        parentDiv.insertAdjacentElement('afterbegin', roleTagContainer);
                        parentDiv.style.height = '110px';
                      }
                    } else {
                      existingRoleTag.style.display = 'flex';
                    }
                  } else {
                    if (existingRoleTag) {
                      if (ids.length > 0) {
                        li.style.display = 'none';
                      } else {
                        li.style.display = 'block';
                      }
                    } else {
                      if (ids.length > 0) {
                        li.style.display = 'none';
                      } else {
                        li.style.display = 'block';
                      }
                    }
                  }
                }
              });
              index += batchSize;
              if (index < liElements.length) {
                setTimeout(processBatch, 50);
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
          setTimeout(findElementsAndStart, 500); // Retry every 500ms until elements are found
        }
      }

      function startScript() {
        clearInterval(namesListInterval);

        updateNamesList();

        // Interval to check changes in IndexedDB and update the UI accordingly
        namesListInterval = setInterval(() => {
          try {
            const dbRequest = indexedDB.open(dbName, 1);
            dbRequest.onsuccess = function(event) {
              const db = event.target.result;
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
            };

            dbRequest.onerror = function(error) {
              log('Failed to open IndexedDB:', error);
            };
          } catch (error) {
            log('Error fetching names list:', error.message);
          }
        }, 1000);

        // Check for changes in localStorage
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
        }, 500);

        // Setting up the MutationObserver
        observer = new MutationObserver((mutations) => {
          let mutationCausedChange = false;
          mutations.forEach((mutation) => {
            if (mutation.addedNodes.length || mutation.removedNodes.length) {
              mutationCausedChange = true;
            }
          });

          if (mutationCausedChange) {
            log('Elements changed, updating the list.');
            shouldCancelProcessing = true;
            if (isProcessing) {
              pendingUpdate = true;
            } else {
              updateNamesList();
            }
          }
        });

        // Observing changes in the UL element and title rows
        const ulElement = document.querySelector('ul.msg-conversations-container__conversations-list');
        const titleRows = document.querySelectorAll('div.msg-conversations-container__title-row');
        
        if (ulElement) {
          observer.observe(ulElement, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
          });
        }

        titleRows.forEach((titleRow) => {
          observer.observe(titleRow, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
          });
        });

        // Clear intervals and keep the observer connected
        observer.disconnect = () => {
          clearInterval(checkLocalStorage);
          clearInterval(namesListInterval);
          log('Observer and intervals cleared');
        };
      }

      findElementsAndStart(); // Start by finding the elements
    })();
  `;

  view
    .executeJavaScript(jsCode)
    .then(() => {
      // console.log(`Custom JS injected into WebView ${id}`);
    })
    .catch((err) =>
      console.error(`Failed to inject custom JS into WebView ${id}:`, err)
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

export const storeShortcutsInIndexedDB = (view, shortcuts) => {
  if (view && shortcuts) {
    view.executeJavaScript(`
      (function() {
        console.log('Attempting to store shortcuts in IndexedDB');

        // Open IndexedDB connection with version incremented to ensure onupgradeneeded runs
        const request = indexedDB.open('ShortcutsDB', 2); // Increment version to force upgrade

        request.onupgradeneeded = function(event) {
          const db = event.target.result;
          console.log('Upgrading database...');

          // Check and create the object store if not present
          if (!db.objectStoreNames.contains('shortcuts')) {
            db.createObjectStore('shortcuts', { keyPath: 'id' });
            console.log('Object store "shortcuts" created.');
          } else {
            console.log('Object store "shortcuts" already exists.');
          }
        };

        request.onsuccess = function(event) {
          const db = event.target.result;
          console.log('Database opened successfully:', db);

          // Ensure object store exists before attempting a transaction
          if (!db.objectStoreNames.contains('shortcuts')) {
            console.error('Object store "shortcuts" not found.');
            db.close();
            return;
          }

          // Start a readwrite transaction to store shortcuts
          const transaction = db.transaction('shortcuts', 'readwrite');
          const store = transaction.objectStore('shortcuts');

          // Clear existing shortcuts
          const clearRequest = store.clear();

          clearRequest.onsuccess = function() {
            console.log('Old shortcuts cleared successfully.');

            // Add new shortcuts
            ${JSON.stringify(shortcuts)}.forEach((shortcut) => {
              const addRequest = store.add(shortcut);
              addRequest.onsuccess = function() {
                console.log('Shortcut added:', shortcut);
              };
              addRequest.onerror = function(event) {
                console.error('Failed to add shortcut:', event.target.error);
              };
            });
          };

          clearRequest.onerror = function(event) {
            console.error('Failed to clear old shortcuts:', event.target.error);
          };

          transaction.oncomplete = function() {
            console.log('All shortcuts stored successfully in IndexedDB.');
          };

          transaction.onerror = function(event) {
            console.error('Transaction failed:', event.target.error);
          };
        };

        request.onerror = function(event) {
          console.error('Failed to open IndexedDB:', event.target.error);
        };

        request.onblocked = function() {
          console.warn('Database open request is blocked. Please close other connections.');
        };
      })();
    `)
      .then(() => {
        console.log('Shortcuts successfully injected and stored in IndexedDB');
      })
      .catch((err) => {
        console.error('Failed to inject and store shortcuts in IndexedDB:', err);
      });
  }
};



export const injectShortcutObserver = (view) => {
  if (view) {
    view.executeJavaScript(`
      (function() {
        console.log('Observing message box for input and fetching shortcuts from IndexedDB');

        let cachedShortcuts = []; // Cache to store shortcuts fetched from IndexedDB

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
          const request = indexedDB.open('ShortcutsDB', 2); // Ensure version matches the latest

          request.onsuccess = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('shortcuts')) {
              console.error('Object store "shortcuts" not found in IndexedDB');
              return;
            }

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

          request.onerror = function() {
            console.error('Failed to open IndexedDB:', event);
          };
        }

        // Function to handle input changes in the message box
        function handleInputChanges(mutations) {
          try {
            mutations.forEach((mutation) => {
              if (mutation.type === 'characterData') {
                const inputText = mutation.target.textContent.trim();
                if (inputText.startsWith('/')) {
                  const command = inputText.slice(1); // Remove the '/' prefix
                  const filteredCommands = cachedShortcuts.filter(shortcut => shortcut.title.startsWith(command));
                  if (filteredCommands.length > 0) {
                    showShortcutList(filteredCommands);
                  }
                } else {
                  const existingList = document.getElementById('shortcut-list');
                  if (existingList) existingList.remove();
                }
              }
            });
          } catch (err) {
            console.error('Failed to handle input changes:', err);
          }
        }

        // Function to observe input changes on the <p> tag
        function addObserver(pTag) {
          if (pTag) {
            const observer = new MutationObserver(handleInputChanges);
            observer.observe(pTag, { characterData: true, subtree: true });
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
                addObserver(pTag);
              } else {
                console.log('<p> tag removed, waiting to re-attach observer...');
              }
            });

            observer.observe(messageBox, { childList: true, subtree: true });
            console.log('Monitoring message box for changes to re-add <p> observer.');
          }
        }

        // Set up a polling mechanism to fetch shortcuts from IndexedDB every 5 seconds
        setInterval(fetchShortcutsFromIndexedDB, 5000);

        // Check for the <p> tag every 500ms until found, then monitor it
        const checkInterval = setInterval(() => {
          const pTag = document.querySelector('.msg-form__contenteditable p');
          if (pTag) {
            addObserver(pTag);
            clearInterval(checkInterval);
            monitorMessageBox(); // Start monitoring the message box for changes
          }
        }, 500);

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
        // Function to add the "Go to Profile" button
        function addGoToProfileButton() {
          // Select the profile link on the page
          const profileLink = document.querySelector('.msg-thread__link-to-profile');
  
          if (profileLink) {
            // Check if the button already exists to avoid duplicates
            if (profileLink.nextElementSibling && profileLink.nextElementSibling.classList.contains('go-to-profile-button')) {
              return;
            }
  
            // Create the button element
            const goToProfileButton = document.createElement('button');
            goToProfileButton.className = 'go-to-profile-button';
            goToProfileButton.style.cursor = 'pointer';
            goToProfileButton.style.position = 'absolute';
            goToProfileButton.style.inset = '0';
            goToProfileButton.addEventListener('click', () => {
              // Fetch the current href dynamically when clicked
              const updatedProfileLink = document.querySelector('.msg-thread__link-to-profile');
              if (updatedProfileLink) {
                const updatedProfileUrl = updatedProfileLink.getAttribute('href');
                // console.log('Current Profile URL:', updatedProfileUrl);
                window.electron.openProfile(updatedProfileUrl, '${accountId}');
              } else {
                // console.log('Profile link not found.');
              }
            });
  
            // Insert the button after the profile link
            profileLink.parentNode.insertBefore(goToProfileButton, profileLink.nextSibling);
          }
        }
  
        // Initial call to add the button
        addGoToProfileButton();
  
        // Set up a MutationObserver to monitor changes in the profile link and its attributes
        const observer = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            // Re-add the button when necessary
            addGoToProfileButton();
          });
        });
  
        // Observe changes in the entire document to cover all scenarios
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true, // Watch for changes in attributes like href
          attributeFilter: ['href'], // Specifically watch for href changes
        });
      })();
    `;

  // Execute the JavaScript in the webview
  view
    .executeJavaScript(jsCode)
    .then(() => {
      // console.log(`Custom JS injected into WebView ${accountId}`);
    })
    .catch((err) =>
      console.error(
        `Failed to inject custom JS into WebView ${accountId}:`,
        err
      )
    );
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

export const updateLabels = (labels, view) => {
  if (view) {
    view
      .executeJavaScript(
        `
        (function() {
          try {
            const dbName = 'LabelsDB';
            const storeName = 'codesStore';

            // Open IndexedDB database
            const request = indexedDB.open(dbName, 1);

            request.onupgradeneeded = (event) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'code' });
                // console.log('Created object store:', storeName);
              }
            };

            request.onsuccess = (event) => {
              const db = event.target.result;
              const transaction = db.transaction(storeName, 'readwrite');
              const store = transaction.objectStore(storeName);

              // Convert labels to an array of individual code entries
              const codesArray = ${JSON.stringify(labels)}
                .map(label => ({
                  code: label.code,
                  codeName: label.codeName,
                  labels: Array.isArray(label.labels) ? label.labels : []
                }));

              // console.log('Labels received:', ${JSON.stringify(labels)});
              // console.log('Formatted codes array:', codesArray);

              // Retrieve all existing labels from the store
              const getAllRequest = store.getAll();

              getAllRequest.onsuccess = (event) => {
                const existingCodes = event.target.result || [];

                // Determine which codes need to be removed or updated
                const codesToRemove = existingCodes.filter(existing => 
                  !codesArray.some(newCode => newCode.code === existing.code));

                // console.log('Codes to remove:', codesToRemove);

                // Remove outdated codes from the store
                codesToRemove.forEach(codeToRemove => {
                  store.delete(codeToRemove.code);
                  removeLabelContainer(null, codeToRemove.code); // Remove from UI
                  // console.log('Removed code:', codeToRemove.code);
                });

                // Update or insert new codes
                codesArray.forEach(item => {
                  const putRequest = store.put(item);

                  putRequest.onsuccess = () => {
                    // console.log('Code stored successfully:', item);
                  };

                  putRequest.onerror = (error) => {
                    console.error('Error storing code:', error);
                  };
                });
              };

              transaction.oncomplete = () => {
                // console.log('IndexedDB updated with new labels');
                updateLiElements(codesArray); // Update the UI
              };

              transaction.onerror = (error) => {
                console.error('Failed to update IndexedDB:', error);
              };
            };

            request.onerror = (error) => {
              console.error('Failed to open IndexedDB:', error);
            };

            // Update <li> elements after DB update
            function updateLiElements(codesArray) {
              // console.log('Updating <li> elements with new labels...');
              const liElements = document.querySelectorAll('ul.msg-conversations-container__conversations-list > li');

              liElements.forEach(li => {
                const anchorElement = li.querySelector('a.msg-conversation-listitem__link');
                const imgElement = anchorElement ? anchorElement.querySelector('img.presence-entity__image') : null;
                const imgSrc = imgElement ? imgElement.src : null;
                const nameTag = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
                
                if (imgSrc && nameTag) {
                  const nameContent = nameTag.textContent.trim();
                  const labelData = codesArray.find(item => item.code === imgSrc);

                  if (labelData && labelData.codeName === nameContent) {
                    // console.log('Matching code found. Adding new labels...');
                    addLabelsToContent(li, labelData); // Add new labels
                  } else {
                    // console.log('No matching code. Removing labels...');
                    removeLabelContainer(li, imgSrc); // Remove outdated labels
                  }
                }
              });
            }

            // Add labels to the content div in the <li> element
            function addLabelsToContent(li, labelData) {
              const parentDiv = li.querySelector('.msg-conversation-card__content--selectable');
              if (!parentDiv) return;

              const roleTagContainerId = \`label-tag-\${labelData.code}\`;
              let roleTagContainer = parentDiv.querySelector(\`#\${CSS.escape(roleTagContainerId)}\`);

              if (!roleTagContainer) {
                roleTagContainer = document.createElement('div');
                roleTagContainer.id = roleTagContainerId;
                roleTagContainer.style.display = 'flex';
                roleTagContainer.style.alignItems = 'center';
                roleTagContainer.style.gap = '5px';
                parentDiv.insertAdjacentElement('afterbegin', roleTagContainer);
                parentDiv.style.height = '110px';
              }

              // Remove existing labels before adding new ones
              roleTagContainer.innerHTML = '';

              // Add new labels
              labelData.labels.forEach(label => {
                const roleSpanContainer = document.createElement('div');
                roleSpanContainer.style.display = 'flex';
                roleSpanContainer.style.alignItems = 'center';
                roleSpanContainer.style.padding = '3px 6px';
                roleSpanContainer.style.borderRadius = '5px';
                roleSpanContainer.style.backgroundColor = '#f6f6f6';
                roleSpanContainer.style.color = label.color;
                roleSpanContainer.style.fontSize = '11px';
                roleSpanContainer.style.marginRight = '5px';

                const roleSpan = document.createElement('span');
                roleSpan.textContent = label.name;

                const closeButton = document.createElement('button');
                closeButton.style.cursor = 'pointer';
                closeButton.style.padding = '0';
                closeButton.style.marginLeft = '5px';
                closeButton.style.display = 'none';
                closeButton.style.width = '10px';
                closeButton.style.height = '10px';
               const svgNS = "http://www.w3.org/2000/svg";
const svgElement = document.createElementNS(svgNS, 'svg');
svgElement.setAttribute('width', '7');
svgElement.setAttribute('height', '7');
svgElement.setAttribute('viewBox', '0 0 7 7');

// Create <path> element for the SVG
const pathElement = document.createElementNS(svgNS, 'path');
pathElement.setAttribute('d', 'M6.81862 5.96446C7.06046 6.20653 7.06046 6.58309 6.81862 6.82517C6.6977 6.94621 6.5499 7 6.38868 7C6.22745 7 6.07965 6.94621 5.95873 6.82517L3.5 4.36407L1.04127 6.82517C0.920346 6.94621 0.772553 7 0.611324 7C0.450096 7 0.302303 6.94621 0.181382 6.82517C-0.0604607 6.58309 -0.0604607 6.20653 0.181382 5.96446L2.64012 3.50336L0.181382 1.04227C-0.0604607 0.800192 -0.0604607 0.423631 0.181382 0.181556C0.423225 -0.0605187 0.799424 -0.0605187 1.04127 0.181556L3.5 2.64265L5.95873 0.181556C6.20058 -0.0605187 6.57677 -0.0605187 6.81862 0.181556C7.06046 0.423631 7.06046 0.800192 6.81862 1.04227L4.35988 3.50336L6.81862 5.96446Z');
pathElement.setAttribute('fill', 'black');

// Append the <path> to the <svg>
svgElement.appendChild(pathElement);

// Append the <svg> to the button
closeButton.appendChild(svgElement);

                closeButton.onclick = async () => {
      try {
        // console.log('Removing label:', label.name);

        // Remove the label from the DOM
        roleSpanContainer.remove();

        // Remove the label from the database
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open('LabelsDB', 1);
          request.onsuccess = (event) => resolve(event.target.result);
          request.onerror = (error) => reject(error);
        });

        const transaction = db.transaction('codesStore', 'readwrite');
        const store = transaction.objectStore('codesStore');
        store.delete(labelData.code);

        transaction.oncomplete = () => {
          // console.log('Label removed from IndexedDB:', label.name);

          // Send updated information to Electron
          window.electron.removeLabel(label.name, labelData.code, labelData.codeName);
        };

        transaction.onerror = (error) => {
          console.error('Failed to remove label from IndexedDB:', error);
        };
      } catch (error) {
        console.error('Error removing label:', error);
      }
    };

                roleSpanContainer.appendChild(roleSpan);
                roleSpanContainer.appendChild(closeButton);
                roleTagContainer.appendChild(roleSpanContainer);

                roleSpanContainer.onmouseenter = () => (closeButton.style.display = 'flex');
                roleSpanContainer.onmouseleave = () => (closeButton.style.display = 'none');
              });
            }

            // Remove outdated labels from the UI
            function removeLabelContainer(li, code) {
              const roleTagContainer = li ? li.querySelector(\`#label-tag-\${CSS.escape(code)}\`) : null;
              if (roleTagContainer) {
                // console.log('Removing label container for code:', code);
                roleTagContainer.remove();
              }
            }
          } catch (error) {
            console.error('Error updating labels:', error);
          }
        })();
        `
      )
      .then(() =>
        console.log(
          `Updated labels in IndexedDB and UI for WebView ${view.getAttribute(
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


export const updateLabelTags = (view) => {
  if (view) {
    view
      .executeJavaScript(
        `
        (function() {
          const dbName = 'LabelsDB';
          const storeName = 'codesStore';
          let labelCache = {}; // Local cache for IndexedDB data

          // Initialize the IndexedDB and cache label data
          function initIndexedDB() {
            // console.log('Initializing IndexedDB...');
            const request = indexedDB.open(dbName, 1);

            request.onupgradeneeded = (event) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'code' });
                // console.log('Created object store:', storeName);
              }
            };

            request.onsuccess = (event) => {
              const db = event.target.result;
              // console.log('IndexedDB initialized successfully.');
              loadLabelsFromDB(db); // Preload all label data into cache
              observeListChanges(db); // Start observing changes in the <ul> element
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
              // console.log('Label data loaded into cache:', labelCache);
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

          // Observe changes in the <ul> element
          function observeListChanges(db) {
            // console.log('Observing changes in the <ul> element...');
            const ulElement = document.querySelector('ul.msg-conversations-container__conversations-list');

            if (!ulElement) {
              // console.log('No <ul> element found. Retrying...');
              setTimeout(() => observeListChanges(db), 1000);
              return;
            }

            const observer = new MutationObserver(throttle(() => {
              // console.log('<ul> element changed. Updating <li> elements...');
              updateLiElements();
            }, 500)); // Throttle updates to 500ms

            observer.observe(ulElement, { childList: true, subtree: true });
            // console.log('Started observing <ul> element changes.');
          }

          // Update <li> elements with labels from the cache
          function updateLiElements() {
            // console.log('Updating <li> elements with labels...');
            const liElements = document.querySelectorAll('ul.msg-conversations-container__conversations-list > li');

            liElements.forEach(li => {
              const anchorElement = li.querySelector('a.msg-conversation-listitem__link');
              const imgElement = anchorElement ? anchorElement.querySelector('img.presence-entity__image') : null;
              const imgSrc = imgElement ? imgElement.src : null;
              const nameTag = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
              
              if (imgSrc && nameTag) {
                const nameContent = nameTag.textContent.trim();
                const labelData = labelCache[imgSrc]; // Get label data from cache

                if (labelData && labelData.codeName === nameContent) {
                  // console.log('Matching code found. Adding labels to <li>...');
                  addLabelsToContent(li, labelData); // Add the labels to the content div
                }
              }
            });
          }

          // Add multiple labels to the content div within the <li> element
          function addLabelsToContent(li, labelData) {
            const parentDiv = li.querySelector('.msg-conversation-card__content--selectable');
            if (!parentDiv) return;

            const roleTagContainerId = \`label-tag-\${labelData.code}\`;
            let roleTagContainer = parentDiv.querySelector(\`#\${CSS.escape(roleTagContainerId)}\`);

            if (!roleTagContainer) {
              roleTagContainer = document.createElement('div');
              roleTagContainer.id = roleTagContainerId;
              roleTagContainer.style.display = 'flex';
              roleTagContainer.style.alignItems = 'center';
              roleTagContainer.style.gap = '5px';
              parentDiv.insertAdjacentElement('afterbegin', roleTagContainer);
              parentDiv.style.height = '110px';
            }

            // Iterate over the labels and add them if not already present
            labelData.labels.forEach(label => {
              if (!Array.from(roleTagContainer.children).some(tag => tag.textContent.includes(label.name))) {
                const roleSpanContainer = document.createElement('div');
                roleSpanContainer.style.display = 'flex';
                roleSpanContainer.style.alignItems = 'center';
                roleSpanContainer.style.padding = '3px 6px';
                roleSpanContainer.style.borderRadius = '5px';
                roleSpanContainer.style.backgroundColor = '#f6f6f6';
                roleSpanContainer.style.color = label.color;
                roleSpanContainer.style.fontSize = '11px';
                roleSpanContainer.style.marginRight = '5px';

                const roleSpan = document.createElement('span');
                roleSpan.textContent = label.name;

                const closeButton = document.createElement('button');
                closeButton.style.background = 'none';
                closeButton.style.border = 'none';
                closeButton.style.cursor = 'pointer';
                closeButton.style.padding = '0';
                closeButton.style.marginLeft = '5px';
                closeButton.style.display = 'none';
                const svgNS = "http://www.w3.org/2000/svg";
const svgElement = document.createElementNS(svgNS, 'svg');
svgElement.setAttribute('width', '7');
svgElement.setAttribute('height', '7');
svgElement.setAttribute('viewBox', '0 0 7 7');

// Create <path> element for the SVG
const pathElement = document.createElementNS(svgNS, 'path');
pathElement.setAttribute('d', 'M6.81862 5.96446C7.06046 6.20653 7.06046 6.58309 6.81862 6.82517C6.6977 6.94621 6.5499 7 6.38868 7C6.22745 7 6.07965 6.94621 5.95873 6.82517L3.5 4.36407L1.04127 6.82517C0.920346 6.94621 0.772553 7 0.611324 7C0.450096 7 0.302303 6.94621 0.181382 6.82517C-0.0604607 6.58309 -0.0604607 6.20653 0.181382 5.96446L2.64012 3.50336L0.181382 1.04227C-0.0604607 0.800192 -0.0604607 0.423631 0.181382 0.181556C0.423225 -0.0605187 0.799424 -0.0605187 1.04127 0.181556L3.5 2.64265L5.95873 0.181556C6.20058 -0.0605187 6.57677 -0.0605187 6.81862 0.181556C7.06046 0.423631 7.06046 0.800192 6.81862 1.04227L4.35988 3.50336L6.81862 5.96446Z');
pathElement.setAttribute('fill', 'black');

// Append the <path> to the <svg>
svgElement.appendChild(pathElement);

// Append the <svg> to the button
closeButton.appendChild(svgElement);

                closeButton.onclick = async () => {
      try {
        // console.log('Removing label:', label.name);

        // Remove the label from the DOM
        

        // Remove the label from the database
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open('LabelsDB', 1);
          request.onsuccess = (event) => resolve(event.target.result);
          request.onerror = (error) => reject(error);
        });

        const transaction = db.transaction('codesStore', 'readwrite');
        const store = transaction.objectStore('codesStore');
        store.delete(labelData.code);

        transaction.oncomplete = () => {
          // console.log('Label removed from IndexedDB:', label.name);

          // Send updated information to Electron
          roleSpanContainer.remove();
          window.electron.removeLabel(label.name, labelData.code, labelData.codeName);
        };

        transaction.onerror = (error) => {
          console.error('Failed to remove label from IndexedDB:', error);
        };
      } catch (error) {
        console.error('Error removing label:', error);
      }
    };

                roleSpanContainer.appendChild(roleSpan);
                roleSpanContainer.appendChild(closeButton);
                roleTagContainer.appendChild(roleSpanContainer);

                roleSpanContainer.onmouseenter = () => (closeButton.style.display = 'flex');
                roleSpanContainer.onmouseleave = () => (closeButton.style.display = 'none');
              }
            });
          }

          // Initialize the IndexedDB and set up observers
          initIndexedDB();
        })();
        `
      )
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


