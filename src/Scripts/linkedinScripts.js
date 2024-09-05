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
          try {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: 'id' });
            }
          } catch (error) {
            console.error('Error creating object store:', error);
          }
        };
  
        openDBRequest.onsuccess = function(event) {
          try {
            const db = event.target.result;
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();
  
            getAllRequest.onsuccess = function(event) {
              previousNamesList = event.target.result.map(item => item.profile);
              startScript();
            };
  
            getAllRequest.onerror = function(error) {
              console.error('Failed to retrieve namesList from IndexedDB:', error);
            };
          } catch (error) {
            console.error('Error during IndexedDB access:', error);
          }
        };
  
        openDBRequest.onerror = function(error) {
          console.error('Failed to open IndexedDB:', error);
        };
  
        function updateNamesList() {
          if (isProcessing) {
            pendingUpdate = true;
            shouldCancelProcessing = true;
            return;
          }
          isProcessing = true;
          shouldCancelProcessing = false;
  
          try {
            const namesList = previousNamesList || [];
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
                  try {
                    const nameTag = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
                    const anchorElement = li.querySelector('a.msg-conversation-listitem__link');
                    const imgElement = anchorElement ? anchorElement.querySelector('img.presence-entity__image') : null;
  
                    let matchedProfile = null;
                    let byCode = false;
  
                    if (imgElement) {
                      const code = imgElement.src.split('/').pop(); // Assuming the code is part of the URL
                      matchedProfile = namesList.find(item => item.code === code);
  
                      if (matchedProfile) {
                        // Code matched, set the tag color to green
                        addRoleTag(li, matchedProfile, true);
                        byCode = true;
                      }
                    }
  
                    // If no profile matched by code, check by name
                    if (!byCode && nameTag) {
                      const name = nameTag.textContent.trim();
                      const matchedByName = namesList.filter(item => item.name === name);
  
                      if (matchedByName.length > 0) {
                        // If there are multiple matches, try to find the right one using id
                        matchedProfile = matchedByName.find(item => li.getAttribute('data-id') === item.id);
                        if (!matchedProfile) {
                          // If no match found by id, use the first one
                          matchedProfile = matchedByName[0];
                        }
  
                        // Display the profile with a tag and orange dot since the code didn't match
                        addRoleTag(li, matchedProfile, false);
                      } else {
                        handleNonMatchedItem(li, namesList.length);
                      }
                    } else if (!matchedProfile) {
                      handleNonMatchedItem(li, namesList.length);
                    } else {
                      // If a role tag exists but is not in the profiles, remove it and set opacity to 0.5
                      const existingRoleTag = li.querySelector('.role-tag-container');
                      if (existingRoleTag && !namesList.some(item => item.id === li.getAttribute('data-id'))) {
                        existingRoleTag.remove();
                        li.style.opacity = '0.5';
                      }
                    }
                  } catch (error) {
                    console.error('Error processing list item:', error);
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
            } else {
              isProcessing = false;
            }
          } catch (error) {
            console.error('Error updating names list:', error);
            isProcessing = false;
          }
        }
  
        function addRoleTag(li, matchedProfile, byCode) {
          const roleTagId = 'role-tag-' + (byCode ? matchedProfile.code : matchedProfile.id);
          let existingRoleTag = document.getElementById(roleTagId);
  
          if (!existingRoleTag) {
            const roleTagContainer = document.createElement('div');
            roleTagContainer.id = roleTagId;
            roleTagContainer.style.display = 'flex';
            roleTagContainer.style.alignItems = 'center';
            roleTagContainer.classList.add('role-tag-container');
  
            const roleSpan = document.createElement('span');
            roleSpan.textContent = matchedProfile.role || 'Role not found';
            roleSpan.style.borderRadius = '5px';
            roleSpan.style.backgroundColor = matchedProfile.bg || '#ccc';
            roleSpan.style.color = matchedProfile.textColor || '#000';
            roleSpan.style.padding = '3px 5px';
            roleSpan.style.fontSize = '12px';
            roleSpan.style.marginRight = '5px';
  
            const idSpan = document.createElement('span');
            idSpan.textContent = matchedProfile.id || 'ID not found';
            idSpan.style.marginLeft = '5px';
            idSpan.style.backgroundColor = matchedProfile.textColor || '#ccc';
            idSpan.style.color = matchedProfile.bg || '#000';
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
            imgSpan.style.backgroundColor = byCode ? 'green' : 'orange';
  
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
        }
  
        function handleNonMatchedItem(li, namesListLength) {
          if (namesListLength === 17) {
            li.style.opacity = '0.5'; // Set opacity to 0.5
            li.style.display = 'block';
          } else {
            li.style.display = 'none'; // Otherwise, hide the element
          }
        }
  
        function startScript() {
          clearInterval(namesListInterval);
          if (observer) observer.disconnect();
  
          updateNamesList();
  
          namesListInterval = setInterval(() => {
            try {
              const currentNamesList = JSON.parse(localStorage.getItem('namesList')) || [];
              if (JSON.stringify(currentNamesList) !== JSON.stringify(previousNamesList)) {
                log('Names List changed');
                previousNamesList = currentNamesList;
                pendingUpdate = true;
                updateNamesList();
              }
            } catch (error) {
              console.error('Error fetching names list from localStorage:', error.message);
            }
          }, 1000);
  
          observer = new MutationObserver(() => {
            if (!isProcessing) {
              updateNamesList();
            }
          });
  
          observer.observe(document.body, {
            childList: true,
            subtree: true,
          });
        }
  
        startScript();
      })();
    `;
  
    view
      .executeJavaScript(jsCode)
      .then(() => {
        console.log(`Custom JS injected into WebView ${id}`);
      })
      .catch((err) => console.error(`Failed to inject custom JS into WebView ${id}:`, err));
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
  
    view.executeJavaScript(jsCode)
      .then(() => {
        return new Promise((resolve, reject) => {
          const interval = setInterval(() => {
            view.executeJavaScript(`
              (function() {
                const name = localStorage.getItem('name');
                return name;
              })();
            `).then((name) => {
              if (name) {
                clearInterval(interval); // Stop the interval once the name is found
                resolve(name);
              } else {
                console.log(`Name not found yet for id ${id}, retrying...`);
              }
            }).catch(error => {
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
      .catch(error => {
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
                  list.style.padding = '10px 0';
                  list.style.listStyle = 'none';
                  list.style.zIndex = '9999';
                  list.style.borderRadius = '20px';
                  list.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
                  list.style.maxHeight = '150px';
                  list.style.overflowY = 'auto';
                  list.style.width = '360px';
                  list.style.overflow = 'hidden';
                  list.style.margin = '0 auto';
  
                  filteredCommands.forEach((shortcut, index) => {
                    const listItem = document.createElement('li');
                    listItem.textContent = shortcut;
                    listItem.style.padding = '8px 10px';
                    listItem.style.cursor = 'pointer';
                    listItem.style.borderRadius = '15px';
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
              console.log(`Shortcut handler injected into WebView ${view.getAttribute("data-id")}`)
            )
            .catch((err) =>
              console.error(
                `Failed to inject shortcut handler for WebView ${view.getAttribute("data-id")}:`,
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
            goToProfileButton.textContent = 'Go to Profile';
            goToProfileButton.className = 'go-to-profile-button';
            goToProfileButton.style.marginLeft = '10px';
            goToProfileButton.style.padding = '5px 10px';
            goToProfileButton.style.borderRadius = '20px';
            goToProfileButton.style.border = 'none';
            goToProfileButton.style.backgroundColor = '#0073b1';
            goToProfileButton.style.color = 'white';
            goToProfileButton.style.cursor = 'pointer';
            goToProfileButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'; // Adds floating visualization
  
            // Add click event listener to the button
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
        console.error(`Failed to inject custom JS into WebView ${accountId}:`, err)
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
  
    view.executeJavaScript(jsCode)
      .then((name) => {
        console.log(`Account name for id ${id}: ${name}`);
      })
      .catch(error => {
        console.error(`Failed to get account name for id ${id}: `, error);
      });
  };