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
                      console.log('IndexedDB updated with namesList in WebView');
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
                  console.log('namesList updated in localStorage with checked items:', itemsToStore);
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
        console.log(message);
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
                  console.log(\`#\${roleTagId}\`);
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
      console.log(`Custom JS injected into WebView ${id}`);
    })
    .catch((err) =>
      console.error(`Failed to inject custom JS into WebView ${id}:`, err)
    );
};

export const injectTryGetAccountName = (view, id, changeName) => {
  const jsCode = `
      (function() {
        function tryGetAccountName() {
          const imgTag = document.querySelector("img.global-nav__me-photo");
          if (imgTag && imgTag.alt) {
            localStorage.setItem('name', imgTag.alt);
            customizeLinkedIn();
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
            console.log('Error customizing LinkedIn: ' + error.message);
          }
        }
  
        function setupContinuousCustomization() {
          // Set up a MutationObserver to keep customizing the UI
          const observer = new MutationObserver(() => {
            customizeLinkedIn();
          });
  
          // Observe the entire document for changes
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
          });
  
          // Initial customization call
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
  
        localStorage.setItem('namesList', JSON.stringify([]));
        setupContinuousCustomization(); // Start observing and customizing continuously
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
                console.log(name)
                return name;
              })();
            `
            )
            .then((name) => {
              if (name) {
                clearInterval(interval); // Stop the interval once the name is found
                resolve(name);
              } else {
                console.log(`Name not found yet for id ${id}, retrying...`);
              }
            })
            .catch((error) => {
              clearInterval(interval); // Stop the interval on error
              reject(error);
            });
        }, 1000); // Check every 1 second
      });
    })
    .then((name) => {
      changeName({ id: id, newName: name });
      console.log(`Account name for id ${id}: ${name}`);
    })
    .catch((error) => {
      console.error(`Failed to get account name for id ${id}: `, error);
    });
};
export const injectShortcutHandler = (view) => {
  if (view) {
    view
      .executeJavaScript(
        `
          (function() {
            console.log('Shortcut handler script loaded.');

            // Define shortcut commands and their corresponding text
            const shortcuts = {
              "/intro": "Hello, <<name>>! This is an introduction message.",
              "/dequed": "Your request has been dequeued, <<name>>.",
              "/confirm": "Thank you for confirming, <<name>>.",
              "/thanks": "Thanks a lot, <<name>>!",
              "/feedback": "We appreciate your feedback, <<name>>."
            };

            // Function to replace placeholder with actual name
            function replaceName(text, name) {
              console.log('Replacing name in text:', text);
              return text.replace(/<<name>>/g, name);
            }

            // Function to fetch the name from the page
            function getName() {
              const nameElement = document.querySelector('h2.msg-entity-lockup__entity-title');
              const name = nameElement ? nameElement.textContent.trim() : "there";
              console.log('Fetched name:', name);
              return name;
            }

            // Function to show the shortcut list
            function showShortcutList(filteredCommands) {
              console.log('Showing shortcut list with commands:', filteredCommands);
              let existingList = document.getElementById('shortcut-list');
              if (existingList) existingList.remove(); // Remove existing list if already present

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
              list.style.overflowX = 'hidden';
              list.style.width = '360px';
              list.style.margin = '0 auto';

              // Custom scrollbar styles
              list.style.scrollbarWidth = 'thin';
              list.style.scrollbarColor = 'black transparent';

              // Apply custom scrollbar styles
              const scrollbarStyles = document.createElement('style');
              scrollbarStyles.innerHTML = \`
                #shortcut-list::-webkit-scrollbar {
                  width: 1px;
                }
                #shortcut-list::-webkit-scrollbar-thumb {
                  background-color: black;
                }
              \`;
              document.head.appendChild(scrollbarStyles);

              filteredCommands.forEach((shortcut) => {
                const listItem = document.createElement('li');
                listItem.textContent = shortcut;
                listItem.style.padding = '8px 10px';
                listItem.style.cursor = 'pointer';
                listItem.style.borderBottom = '1px solid #ddd'; // Border bottom for each item
                listItem.style.transition = 'background-color 0.2s ease';
                listItem.setAttribute('role', 'button'); // Accessibility feature

                // Highlight the selected item on focus
                listItem.addEventListener('mouseenter', () => {
                  listItem.style.backgroundColor = '#e0e7ff';
                });

                listItem.addEventListener('mouseleave', () => {
                  listItem.style.backgroundColor = 'transparent';
                });

                listItem.addEventListener('click', () => {
                  const name = getName();
                  const messageBox = document.querySelector('.msg-form__contenteditable p');
                  if (messageBox) {
                    messageBox.textContent = replaceName(shortcuts[shortcut], name);
                    console.log('Inserted shortcut text:', shortcuts[shortcut]);
                    // Trigger input events for LinkedIn
                    ['input', 'keyup', 'keydown'].forEach(eventType => {
                      const event = new Event(eventType, { bubbles: true });
                      messageBox.dispatchEvent(event);
                    });
                  }
                  list.remove(); // Remove the list after selection
                  console.log('Shortcut list removed after selection.');
                });

                list.appendChild(listItem);
              });

              document.body.appendChild(list);
              const messageBox = document.querySelector('.msg-form__contenteditable');
              const rect = messageBox.getBoundingClientRect();
              list.style.top = (rect.top - list.offsetHeight - 5) + 'px'; 
              list.style.left = (rect.left + (rect.width / 2) - (list.offsetWidth / 2)) + 'px';
              console.log('Shortcut list added to the DOM.');
            }

            // Function to filter commands based on input
            function filterCommands(input) {
              const filtered = Object.keys(shortcuts).filter(command => command.startsWith(input));
              console.log('Filtered commands:', filtered);
              return filtered;
            }

            // Function to handle input changes and check for shortcuts
            function handleInputChanges(mutations) {
              mutations.forEach((mutation) => {
                if (mutation.type === 'characterData') {
                  const inputText = mutation.target.textContent.trim();
                  console.log('Current input text:', inputText);
                  if (inputText.startsWith('/')) {
                    const filteredCommands = filterCommands(inputText);
                    if (filteredCommands.length > 0) {
                      showShortcutList(filteredCommands);
                    }
                  } else {
                    const existingList = document.getElementById('shortcut-list');
                    if (existingList) {
                      existingList.remove();
                      console.log('Removed shortcut list as input no longer starts with "/".');
                    }
                  }
                }
              });
            }

            // Observe the <p> tag inside the message box for changes
            function addObserver() {
              const pTag = document.querySelector('.msg-form__contenteditable p');
              if (pTag) {
                const observer = new MutationObserver(handleInputChanges);
                observer.observe(pTag, { characterData: true, subtree: true });
                console.log('Observer added to <p> tag inside message box.');
                clearInterval(checkInterval); // Stop checking once the <p> tag is found
              } else {
                console.log('Message box <p> tag not found yet, continuing to check...');
              }
            }

            // Check for the <p> tag every 500ms until found
            const checkInterval = setInterval(addObserver, 500);

            // Function to re-add the observer when necessary
            function reAddObserver() {
              clearInterval(checkInterval);
              addObserver();
            }

            // Hide the list when clicking outside
            document.addEventListener('click', (event) => {
              const list = document.getElementById('shortcut-list');
              if (list && !list.contains(event.target)) {
                list.remove();
                console.log('Shortcut list removed on outside click.');
                reAddObserver();
              }
            });

            // Prevent showing the list multiple times
            document.addEventListener('keydown', (event) => {
              if (event.key === 'Escape') {
                const list = document.getElementById('shortcut-list');
                if (list) {
                  list.remove();
                  console.log('Shortcut list removed on Escape key press.');
                  reAddObserver();
                }
              }
            });

            // Ensure observer stays active and correctly handles inputs
            document.addEventListener('input', () => {
              reAddObserver();
            });

          })();
        `
      )
      .then(() =>
        console.log(
          `Shortcut handler injected into WebView ${view.getAttribute(
            "data-id"
          )}`
        )
      )
      .catch((err) =>
        console.error(
          `Failed to inject shortcut handler for WebView ${view.getAttribute(
            "data-id"
          )}:`,
          err
        )
      );
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
                console.log('Current Profile URL:', updatedProfileUrl);
                window.electron.openProfile(updatedProfileUrl, '${accountId}');
              } else {
                console.log('Profile link not found.');
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
      console.log(`Custom JS injected into WebView ${accountId}`);
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
            console.log('Error customizing LinkedIn: ' + error.message);
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
      console.log(`Account name for id ${id}: ${name}`);
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
        console.log('Keydown event detected:', event.key);
        // Check for Cmd+L (Mac) or Ctrl+L (Windows/Linux)
        if ((event.metaKey || event.ctrlKey) && event.key === 'l') {
          event.preventDefault(); // Prevent default browser action
          console.log('Cmd+L or Ctrl+L pressed. Searching for active conversation...');
          checkActiveConversation();
        }
      }

      // Function to check for the active conversation and extract the image element and name
      function checkActiveConversation() {
        // Find the active conversation list item
        const activeLi = document.querySelector('.msg-conversations-container__convo-item-link--active');
        if (activeLi) {
          console.log('Active conversation detected:', activeLi);
          const nameTag = activeLi.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
          console.log(nameTag)
          if (nameTag) {
            const imgElement = activeLi.querySelector('img.presence-entity__image');
            const imgSrc = imgElement ? imgElement.src : null;

            const name = nameTag ? nameTag.textContent.trim() : null;

            // Send the data to the main process via Electron
            if (imgSrc && name) {
              window.electron.addLabel(imgSrc, '${accountId}', name);
            } else {
              console.log('Name or image source not found.');
            }
          } else {
            console.log('Anchor element not found in active conversation.');
          }
        } else {
          console.log('No active conversation detected.');
        }
      }

      // Initialize the script and attach the event listeners
      console.log('Initializing script...');
      console.log('Attaching keydown event listener...');
      document.addEventListener('keydown', handleKeyDown);
    })();
  `;

  // Execute the JavaScript in the webview
  view
    .executeJavaScript(jsCode)
    .then(() => {
      console.log("Custom JS injected successfully.");
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
                db.createObjectStore(storeName, { keyPath: 'code' }); // Use 'code' as the key path
                console.log('Created object store:', storeName);
              }
            };

            request.onsuccess = (event) => {
              const db = event.target.result;
              const transaction = db.transaction(storeName, 'readwrite');
              const store = transaction.objectStore(storeName);

              // Clear existing store
              store.clear().onsuccess = () => {
                // Convert labels to an array of individual code entries
                const codesArray = ${JSON.stringify(labels)}
                  .map(label => ({
                    code: label.code, // Unique key for the object store
                    codeName: label.codeName,
                    labels: Array.isArray(label.labels) ? label.labels : [] // Ensure labels are stored as an array of objects with name and color
                  }));

                console.log('Labels received:', ${JSON.stringify(labels)});
                console.log('Formatted codes array:', codesArray);

                // Add each code entry to the store
                codesArray.forEach(item => {
                  const putRequest = store.put(item);

                  putRequest.onsuccess = () => {
                    console.log('Code stored successfully:', item);
                  };

                  putRequest.onerror = (error) => {
                    console.error('Error storing code:', error);
                  };
                });
              };

              transaction.oncomplete = () => {
                console.log('IndexedDB updated with labels in WebView');
              };

              transaction.onerror = (error) => {
                console.error('Failed to update IndexedDB in WebView:', error);
              };
            };

            request.onerror = (error) => {
              console.error('Failed to open IndexedDB in WebView:', error);
            };
          } catch (error) {
            console.error('Error updating labels:', error);
          }
        })();
        `
      )
      .then(() =>
        console.log(
          `Updated labels in IndexedDB for WebView ${view.getAttribute(
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

          // Initialize the IndexedDB
          function initIndexedDB() {
            console.log('Initializing IndexedDB...');
            const request = indexedDB.open(dbName, 1);

            request.onupgradeneeded = (event) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'code' });
                console.log('Created object store:', storeName);
              }
            };

            request.onsuccess = (event) => {
              const db = event.target.result;
              console.log('IndexedDB initialized successfully.');
              observeListChanges(db); // Start observing changes in the <ul> element
            };

            request.onerror = (error) => {
              console.error('Failed to open IndexedDB:', error);
            };
          }

          // Observe changes in the <ul> element
          function observeListChanges(db) {
            console.log('Observing changes in the <ul> element...');
            const ulElement = document.querySelector('ul.msg-conversations-container__conversations-list');

            if (!ulElement) {
              console.log('No <ul> element found. Retrying...');
              setTimeout(() => observeListChanges(db), 1000);
              return;
            }

            const observer = new MutationObserver(() => {
              console.log('<ul> element changed. Updating <li> elements...');
              updateLiElements(db);
            });

            observer.observe(ulElement, { childList: true, subtree: true });
            console.log('Started observing <ul> element changes.');
            updateLiElements(db); // Initial check for existing <li> elements
          }

          // Update <li> elements with labels from the IndexedDB
          function updateLiElements(db) {
            console.log('Updating <li> elements with labels...');
            const liElements = document.querySelectorAll('ul.msg-conversations-container__conversations-list > li');

            liElements.forEach(li => {
              const anchorElement = li.querySelector('a.msg-conversation-listitem__link');
              const imgElement = anchorElement ? anchorElement.querySelector('img.presence-entity__image') : null;
              const imgSrc = imgElement ? imgElement.src : null;
              const nameTag = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
              
              if (imgSrc && nameTag) {
                const nameContent = nameTag.textContent.trim();
                console.log('Found <img> element with src:', imgSrc);

                // Fetch label data from IndexedDB based on the code
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const getRequest = store.get(imgSrc); // Check directly with imgSrc as the key

                getRequest.onsuccess = (event) => {
                  const labelData = event.target.result;
                  console.log('Fetched label data from IndexedDB:', labelData);

                  // Compare the img src and the code in the database
                  if (labelData && labelData.code === imgSrc && nameContent === labelData.codeName) {
                    console.log('Matching code found. Adding labels to <li>...');
                    addLabelsToContent(li, labelData); // Add the labels to the content div
                  } else {
                    console.log('No matching code found for img src:', imgSrc);
                  }
                };

                getRequest.onerror = (error) => {
                  console.error('Failed to retrieve label from IndexedDB:', error);
                };
              } else {
                console.log('No <img> element found within <li>.');
              }
            });
          }

          // Add multiple labels to the content div within the <li> element
          function addLabelsToContent(li, labelData) {
            console.log('Adding labels to content div:', labelData);

            const parentDiv = li.querySelector('.msg-conversation-card__content--selectable');
            if (!parentDiv) {
              console.log('Content div not found in <li>.');
              return;
            }

            // Check if the tag container with the same ID already exists
            const roleTagContainerId = \`label-tag-\${labelData.code}\`;
            let roleTagContainer = parentDiv.querySelector(\`#\${CSS.escape(roleTagContainerId)}\`);
            if (!roleTagContainer) {
              // Create a container for the role tags if not already present
              roleTagContainer = document.createElement('div');
              roleTagContainer.id = roleTagContainerId;
              roleTagContainer.style.display = 'flex';
              roleTagContainer.style.alignItems = 'center';
              roleTagContainer.style.gap = '5px'; // Set the gap between tags
              roleTagContainer.classList.add('role-tag-container');
              parentDiv.insertAdjacentElement('afterbegin', roleTagContainer);
              parentDiv.style.height = '130px'; // Adjust the height
            }

            // Iterate over the labels array and add each as a separate tag
            labelData.labels.forEach(label => {
              // Check if a tag with the same name already exists in the container
              const existingTag = Array.from(roleTagContainer.children).some(tag => tag.textContent.includes(label.name));
              if (existingTag) {
                console.log('Label tag already exists:', label.name);
                return;
              }

              // Create the label tag container
              const roleSpanContainer = document.createElement('div');
              roleSpanContainer.style.display = 'flex';
              roleSpanContainer.style.alignItems = 'center';
              roleSpanContainer.style.padding = '5px 10px';
              roleSpanContainer.style.borderRadius = '5px';
              roleSpanContainer.style.backgroundColor = label.color;
              roleSpanContainer.style.color = '#fff';
              roleSpanContainer.style.fontSize = '12px';
              roleSpanContainer.style.marginRight = '5px';
              roleSpanContainer.classList.add('label-tag');
              roleSpanContainer.style.position = 'relative'; // To position the close button

              // Create the label text
              const roleSpan = document.createElement('span');
              roleSpan.textContent = label.name;
              roleSpan.style.marginRight = '8px';

              // Create the close button with SVG
              const closeButton = document.createElement('button');
              closeButton.style.background = 'none';
              closeButton.style.border = 'none';
              closeButton.style.cursor = 'pointer';
              closeButton.style.padding = '0';
              closeButton.style.marginLeft = '5px';
              closeButton.style.display = 'none'; // Initially hidden
              closeButton.style.position = 'absolute';
              closeButton.style.right = '5px';
              closeButton.style.top = '50%';
              closeButton.style.transform = 'translateY(-50%)';
              closeButton.style.transition = 'opacity 0.3s ease'; // Smooth transition

              // Add the SVG to the button
              const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
              svgElement.setAttribute("width", "7");
              svgElement.setAttribute("height", "7");
              svgElement.setAttribute("viewBox", "0 0 7 7");
              svgElement.setAttribute("fill", "none");

              const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
              pathElement.setAttribute("d", "M6.81862 5.96446C7.06046 6.20653 7.06046 6.58309 6.81862 6.82517C6.6977 6.94621 6.5499 7 6.38868 7C6.22745 7 6.07965 6.94621 5.95873 6.82517L3.5 4.36407L1.04127 6.82517C0.920346 6.94621 0.772553 7 0.611324 7C0.450096 7 0.302303 6.94621 0.181382 6.82517C-0.0604607 6.58309 -0.0604607 6.20653 0.181382 5.96446L2.64012 3.50336L0.181382 1.04227C-0.0604607 0.800192 -0.0604607 0.423631 0.181382 0.181556C0.423225 -0.0605187 0.799424 -0.0605187 1.04127 0.181556L3.5 2.64265L5.95873 0.181556C6.20058 -0.0605187 6.57677 -0.0605187 6.81862 0.181556C7.06046 0.423631 7.06046 0.800192 6.81862 1.04227L4.35988 3.50336L6.81862 5.96446Z");
              pathElement.setAttribute("fill", "white");

              svgElement.appendChild(pathElement);
              closeButton.appendChild(svgElement);

              // Close button click event
              closeButton.onclick = () => {
                console.log('Label removed:', label.name);
                roleSpanContainer.remove(); // Remove the label from the DOM
                window.electron.removeLabel(label.name, labelData.code, labelData.codeName); // Call the Electron function
              };

              // Append elements
              roleSpanContainer.appendChild(roleSpan);
              roleSpanContainer.appendChild(closeButton);
              roleTagContainer.appendChild(roleSpanContainer);

              // Show the close button on hover
              roleSpanContainer.onmouseenter = () => {
                closeButton.style.display = 'flex'; // Show the button
              };
              roleSpanContainer.onmouseleave = () => {
                closeButton.style.display = 'none'; // Hide the button
              };
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







export const handleDropdownClick = (view) => {
  const jsCode = `
    (function() {
      // Function to set opacity and trigger click on the button
      function triggerDropdownActions() {
        // Find the parent dropdown container
        const dropdownContainer = document.querySelector('.artdeco-dropdown.msg-thread-actions__dropdown');
        console.log(dropdownContainer)

        if (dropdownContainer) {
          // Find the button within the dropdown container
          const button = dropdownContainer.querySelector('.msg-thread-actions__control');

          // Find the specific dropdown content inside the container
          const dropdownContent = dropdownContainer.querySelector('.msg-thread-actions__dropdown-options.artdeco-dropdown__content');

          if (dropdownContent) {
            // Set the opacity of the dropdown content to 0
            dropdownContent.style.opacity = '0';
            console.log('Dropdown content opacity set to 0.');

            // Trigger a click on the button
            if (button) {
              button.click();
              console.log('Dropdown button clicked.');

              // After button click, wait briefly then search for the "Archive" option
              setTimeout(() => {
                const archiveOption = Array.from(dropdownContent.querySelectorAll('div'))
                  .find(div => div.textContent.trim() === 'Archive');

                if (archiveOption) {
                  archiveOption.click();
                  console.log('Archive option clicked.');
                } else {
                  console.log('Archive option not found.');
                }
              }, 500); // Adjust timeout as needed
            } else {
              console.log('Button not found in dropdown container.');
            }
          } else {
            console.log('Dropdown content not found inside the container.');
          }
        } else {
          console.log('Dropdown container not found.');
        }
      }

      // Function to handle keydown events
      function handleKeyDown(event) {
        // Check for Cmd + Shift + A (Mac) or Ctrl + Shift + A (Windows/Linux)
        if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
          event.preventDefault();
          console.log('Cmd + Shift + A detected.');
          triggerDropdownActions();
        }
      }

      // Attach the event listener for keydown
      document.addEventListener('keydown', handleKeyDown);
      console.log('Event listener for Cmd + Shift + A attached.');
    })();
  `;

  // Execute the JavaScript in the webview
  view
    .executeJavaScript(jsCode)
    .then(() => {
      console.log("Custom JS injected successfully.");
    })
    .catch((err) => {
      console.error("Failed to inject custom JS:", err);
    });
};





// export const monitorTitleBarChanges = (view) => {
//   if (view) {
//     view
//       .executeJavaScript(
//         `
//           (function () {
//             // Keydown event listener to detect Cmd + Shift + A
//             document.addEventListener('keydown', (event) => {
//               if (event.metaKey && event.shiftKey && event.key === 'a') {
//                 event.preventDefault();
//                 console.log('Cmd + Shift + A detected');
//                 checkForTitleBar(); // Start checking for the title bar div when keys are pressed
//               }
//             });

//             // Function to start observing the entire document for changes
//             function startObservingUI() {
//               const observer = new MutationObserver((mutationsList) => {
//                 mutationsList.forEach((mutation) => {
//                   // Check if the mutation added nodes or if any changes occurred
//                   if (mutation.addedNodes.length > 0 || mutation.type === 'childList') {
//                     // Continuously check for the msg-title-bar__title-bar-title
//                     checkForTitleBar();
//                   }
//                 });
//               });

//               // Start observing the entire document body for child changes
//               observer.observe(document.body, { childList: true, subtree: true });
//               // console.log('Started observing UI changes.');
//             }

//             // Function to continuously check for the target title bar div
//             function checkForTitleBar() {
//               const titleBarDiv = document.querySelector('.msg-title-bar__title-bar-title');

//               if (titleBarDiv) {
//                 // console.log('Found the title bar div:', titleBarDiv);
//                 handleTitleBarInteraction(titleBarDiv); // Handle further interaction with the title bar div
//               } else {
//                 // console.log('Title bar div not found, waiting for changes...');
//               }
//             }

//             // Function to handle interactions within the title bar div
//             function handleTitleBarInteraction(titleBarDiv) {
//               const dropdownButton = titleBarDiv.querySelector('.artdeco-dropdown--placement-bottom');

//               if (dropdownButton) {
//                 console.log('Dropdown button found within the title bar div, clicking...');
//                 dropdownButton.click();
//                 observeDropdownChanges(titleBarDiv); // Start observing dropdown changes within the div
//               } else {
//                 console.log('Dropdown button not found within the title bar div.');
//               }
//             }

//             // Function to observe changes in the dropdown container within the title bar div
//             function observeDropdownChanges(titleBarDiv) {
//               const targetContainer = titleBarDiv.querySelector('.msg-thread-actions__dropdown-container');

//               if (!targetContainer) {
//                 // console.log('Dropdown container not found within the title bar div, retrying...');
//                 setTimeout(() => observeDropdownChanges(titleBarDiv), 1000); // Retry observing every 1 second until found
//                 return;
//               }

//               // Set up a MutationObserver to monitor the target container within the title bar div
//               const observer = new MutationObserver((mutationsList) => {
//                 mutationsList.forEach((mutation) => {
//                   // Check if an <ul> was added to the DOM
//                   mutation.addedNodes.forEach((node) => {
//                     if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'UL') {
//                       // console.log('UL element added to DOM within the title bar div:', node);
//                       hideULAndClick(node);
//                     }
//                   });
//                 });
//               });

//               observer.observe(targetContainer, { childList: true, subtree: true });
//               // console.log('Started observing dropdown container for changes within the title bar div.');
//             }

//             // Function to hide the <ul> element and click on the specific <div> inside it
//             function hideULAndClick(ulElement) {
//               ulElement.style.visibility = 'hidden'; // Hide the <ul> element
//               // console.log('UL element visibility set to hidden within the title bar div.');

//               // Find the target div within the <ul>
//               const targetDiv = ulElement.querySelector(
//                 '.msg-thread-actions__dropdown-option[data-view-name="message-toolbar-dropdown-toggle-archive"]'
//               );

//               if (targetDiv) {
//                 // console.log('Target div found within the UL, performing click:', targetDiv);
//                 targetDiv.click(); // Click on the specific <div>
//               } else {
//                 // console.log('Target div not found in the UL within the title bar div, retrying...');
//               }
//             }

//             // Start observing the UI for changes
//             startObservingUI();
//           })();
//         `
//       )
//       .then(() => {
//         console.log(
//           `Started monitoring changes for WebView ${view.getAttribute(
//             "data-id"
//           )}`
//         );
//       })
//       .catch((err) =>
//         console.error(
//           `Failed to monitor changes for WebView ${view.getAttribute(
//             "data-id"
//           )}:`,
//           err
//         )
//       );
//   }
// };




