export const updateRoles = (selectedProfiles, webviewRefs) => {
    const namesList = selectedProfiles;
  
    Object.values(webviewRefs.current).forEach((webviews) => {
      webviews.forEach((view) => {
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
      });
    });
  };
  export const updateList = (checkedItems, webviewRefs) => {
    Object.values(webviewRefs.current).forEach((webviews) => {
      webviews.forEach((view) => {
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
      });
    });
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
            // Apply UI changes for LinkedIn customization
            const existingDiv = document.querySelector('.scaffold-layout__main');
            if (existingDiv) {
              existingDiv.style.height = '100vh';
              existingDiv.style.width = '100vw';
              existingDiv.style.overflow = 'hidden';
            }
  
            const innerDiv = document.getElementById('global-nav');
            if (innerDiv) {
              innerDiv.style.display = 'none';
            }
  
            const authOutlet = document.querySelector('.authentication-outlet');
            if (authOutlet) {
              authOutlet.style.margin = '0';
              authOutlet.style.padding = '0';
              authOutlet.style.overflow = 'hidden';
              
            }
  
            const messagingElement = document.querySelector('.scaffold-layout__content--list-detail-aside');
            if (messagingElement) {
              messagingElement.style.margin = '0';
              messagingElement.style.padding = '0';
            }
  
            const element1 = document.getElementById("messaging");
            if (element1) {
              element1.style.height = '100%';
              element1.style.width = '100%';
              element1.style.flexDirection = 'row';
              element1.style.margin = '0';
            }
  
            const element2 = document.querySelector('.scaffold-layout__aside');
            if (element2) {
              element2.style.display = 'none';
            }
  
            const element3 = document.getElementById('main');
            if (element3) {
              element3.style.margin = '0';
              element3.style.padding = '0';
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