import React, { useEffect, useState, useRef, useContext } from "react";
import { ProfileContext } from "../auth/ProfileProvider";
const BrowserViews = ({ accounts, visibleAccountId, setProfileName }) => {
  const containerRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
 const {selectedProfiles} = useContext(ProfileContext)
  // Handle accounts
  useEffect(() => {
    if (!containerRef.current) return;

    const existingIds = accounts.map(account => account.id);

    Array.from(containerRef.current.children).forEach(child => {
      const id = child.id.replace('view-container-', '');
      if (!existingIds.includes(id)) {
        containerRef.current.removeChild(child);
      }
    });

    accounts.forEach(account => {
      if (account.id && account.partition) {
        createOrUpdateWebView(account.id, account.partition);
      }
    });
  }, [accounts]);

  // Update namesList in localStorage when it changes
  useEffect(() => {
    if (selectedProfiles) {
      updateLocalStorageNamesList();
    }
  }, [selectedProfiles]);

  const createOrUpdateWebView = (id, partition) => {
    if (!id || !partition) return;

    const sanitizedId = `view-container-${id.replace(/[:.]/g, '_')}`;

    let viewContainer = containerRef.current.querySelector(`#${sanitizedId}`);
    if (!viewContainer) {
      // Create new view container
      viewContainer = document.createElement("div");
      viewContainer.id = sanitizedId;
      viewContainer.style.position = "absolute";
      viewContainer.style.top = 0;
      viewContainer.style.left = 0;
      viewContainer.style.width = "100%";
      viewContainer.style.height = "100%";
      viewContainer.style.zIndex = 0;
      containerRef.current.appendChild(viewContainer);

      // Create new WebView
      const view = document.createElement("webview");
      view.setAttribute("src", "https://www.linkedin.com/messaging/");
      view.setAttribute("partition", partition);
      view.setAttribute("data-id", id);
      view.style.width = "100%";
      view.style.height = "100%";
      viewContainer.appendChild(view);

      // Wait for the webview to be fully loaded
      view.addEventListener("dom-ready", () => {
        // view.openDevTools();
        injectCustomJS(view, id);
        getAccountName(id);
      });
    }
  };

  useEffect(() => {
    if (!containerRef.current || !visibleAccountId) return;

    const sanitizedVisibleId = visibleAccountId.replace(/[:.]/g, '_');
    const viewContainers = containerRef.current.querySelectorAll("div[id^='view-container']");
    viewContainers.forEach(view => {
      if (view.id === `view-container-${sanitizedVisibleId}`) {
        view.style.zIndex = 10;
      } else {
        view.style.zIndex = 0;
      }
    });
  }, [visibleAccountId]);

  const getAccountName = (id) => {
    const view = document.querySelector(`webview[data-id="${id}"]`);
    if (!view) return null;

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
          const imgTag = document.querySelector('img.global-nav__me-photo');
          if (imgTag) {
            const accountName = imgTag.alt;
            localStorage.setItem("name", accountName);
            const titleRow = document.querySelector('.msg-conversations-container__title-row');
            if (titleRow) {
              titleRow.style.display = 'none';
            }
  
            const existingDiv = document.querySelector('.scaffold-layout__row');
            if (!existingDiv) {
              const newDiv = document.createElement('div');
              newDiv.className = 'scaffold-layout__row scaffold-layout__content scaffold-layout__content--list-detail-aside scaffold-layout__content--has-aside';
              newDiv.style.margin = '0';
              document.body.appendChild(newDiv);
            } else {
              existingDiv.style.margin = '0';
            }
  
            const innerDiv = document.querySelector('.scaffold-layout__inner.scaffold-layout-container.scaffold-layout-container--reflow');
            if (innerDiv) {
              innerDiv.style.margin = '0';
            }
  
            const authOutlet = document.querySelector('.authentication-outlet');
            if (authOutlet) {
              authOutlet.style.margin = '0';
              authOutlet.style.padding = '0';
              authOutlet.style.overflow = 'hidden';
            }
  
            const messagingElement = document.getElementById('messaging');
            if (messagingElement) {
              messagingElement.style.width = '100vw';
              messagingElement.style.height = '100vh';
            }
            const mainElement = document.getElementById('main');
            if (mainElement) {
              mainElement.style.position = 'fixed';
              mainElement.style.top = '0';
              mainElement.style.bottom = '0';
              mainElement.style.left = '0';
              mainElement.style.right = '0';
              mainElement.style.height = '100vh';
            }
  
            hideElements();
            setupUrlListener(); // Set up the URL change listener
          } else {
            log('Image tag not found, retrying...');
            setTimeout(customizeLinkedIn, 500);
          }
        } catch (error) {
          log('Error customizing LinkedIn: ' + error.message);
        }
      }
  
      function hideElements() {
        try {
          document.querySelectorAll('header, .msg-overlay-list-bubble, aside').forEach(element => element.style.display = 'none');
          const mainElement = document.querySelector('main.scaffold-layout__main');
          if (mainElement) {
            mainElement.style.cssText = 'width: 100vw; height: 100vh;';
          }
        } catch (error) {
          log('Error hiding elements: ' + error.message);
        }
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
      return tryGetAccountName();
    })();
  `;
  

    view.executeJavaScript(jsCode).then(() => {
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
    }).then((name) => {
      window.electron.saveName({ name, id });
      setProfileName((prev)=>!prev)
      console.log(`Account name for id ${id}: ${name}`);
    }).catch(error => {
      console.error(`Failed to get account name for id ${id}:`, error);
    });
    
    
  };

  const injectCustomJS = (view, id) => {
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
  
        let previousNamesList = localStorage.getItem('namesList') || []
  
        function updateNamesList() {
          if (isProcessing) {
            pendingUpdate = true;
            shouldCancelProcessing = true;
            return;
          }
          isProcessing = true;
          shouldCancelProcessing = false;
          try {
            const namesList = JSON.parse(localStorage.getItem('namesList')) || [];
            const ulElement = document.querySelector('ul.msg-conversations-container__conversations-list');
            if (ulElement && namesList.length > 0) {
              let liElements = Array.from(ulElement.querySelectorAll('li'));
              const batchSize = 100; // Process 100 items at a time
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
                    const roleTagId = 'role-tag-' + name.replace(/\\s+/g, '-');
                    let existingRoleTag = document.getElementById(roleTagId);
                    li.style.display = 'block';
                    if (matchedName) {
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
                          imgSpan.style.backgroundColor = 'orange'; // Default to orange if code is not found
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
                        existingRoleTag.style.display = 'none';
                      }
                      li.style.display = 'none';
                    }
                  }
                });
                index += batchSize;
                if (index < liElements.length) {
                  setTimeout(processBatch, 50); // Slight delay between batches
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
              if (ulElement) {
                ulElement.querySelectorAll('li').forEach(li => {
                  li.style.display='block';
                  const nameTag = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
                  if (nameTag) {
                    const name = nameTag.textContent.trim();
                    const roleTagId = 'role-tag-' + name.replace(/\\s+/g, '-');
                    let existingRoleTag = document.getElementById(roleTagId);
                    if (existingRoleTag) {
                      existingRoleTag.style.display = 'none';
                    }
                  }
                });
              }
              isProcessing = false;
            }
          } catch (error) {
            log('Error updating names list: ' + error.message);
            isProcessing = false;
          }
        }
  
        function startScript() {
          clearInterval(namesListInterval);
          if (observer) observer.disconnect();
  
          updateNamesList();
  
          namesListInterval = setInterval(() => {
            try {
              const currentNamesList = localStorage.getItem('namesList') || [];
              if (currentNamesList !== previousNamesList) {
                log('Names List changed');
                previousNamesList = currentNamesList;
                pendingUpdate = true;
                updateNamesList(); // Immediately update on localStorage change
              }
            } catch (error) {
              log('Error parsing names list: ' + error.message);
            }
          }, 1000);
  
          observer = new MutationObserver((mutations) => {
            let mutationCausedChange = false;
            mutations.forEach((mutation) => {
              if (mutation.addedNodes.length || mutation.removedNodes.length) {
                mutationCausedChange = true;
              }
            });
            if (mutationCausedChange && !isProcessing) {
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
  
    view.executeJavaScript(jsCode)
      .then(() => { 
        console.log(`Custom JS injected into WebView ${id}`);
        setScriptLoaded(true);
      })
      .catch(err => console.error(`Failed to inject custom JS into WebView ${id}:`, err));
  };
  
  
  
  
  
  
  
  const updateLocalStorageNamesList = () => {
    let namesList = JSON.stringify(selectedProfiles)
    Array.from(containerRef.current.children).forEach(child => {
      const view = child.querySelector("webview");
      if (view && scriptLoaded) {
        view.executeJavaScript(`
          localStorage.setItem('namesList', '${namesList}');
        `).then(() => console.log(`Updated namesList in localStorage for WebView ${view.getAttribute('data-id')}`))
        .catch(err => console.error(`Failed to update namesList for WebView ${view.getAttribute('data-id')}:`, err));
      }
    });
  };

  return <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }} />;
};

export default BrowserViews;
