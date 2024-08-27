// custom-script.js

(function() {
  let observer;

  function removeObserver() {
    if (observer) {
      observer.disconnect();
      console.log('Observer disconnected');
    }
  }

  function injectScript() {
    try {
      const logs = [];
      const log = (message) => {
        console.log(message);
      };

      log('LinkedIn Customizer content script loaded');
      const namesList = window.namesList; // Access namesList from the global window object
      log('Names List:', namesList);
      let accountName;

      function customizeLinkedIn() {
        try {
          const imgTag = document.querySelector('img.global-nav__me-photo');
          if (imgTag) {
            accountName = imgTag.alt;
            localStorage.setItem("name", accountName);
            const titleRow = document.querySelector('.msg-conversations-container__title-row');
            if (titleRow) {
              titleRow.style.display='none';
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
            customizeConversationList();
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

      function customizeConversationList() {
        try {
          const ulElement = document.querySelector('ul.msg-conversations-container__conversations-list');
          if (ulElement) {
            if (namesList.length > 0) {
              ulElement.querySelectorAll('li').forEach(li => {
                const nameTag = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
                if (nameTag) {
                  const name = nameTag.textContent.trim();
                  const matchedName = namesList.find(item => item.name === name);
                  const roleTagId = 'role-tag-' + name.replace(/\\s+/g, '-');
                  let existingRoleTag = document.getElementById(roleTagId);
                  log(matchedName);
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
                      console.log("console.log(code)");
                      console.log(code);
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
                        parentDiv.style.height = '100px';
                      }
                    } else {
                      // Update the content if the roleTagContainer already exists
                      const roleSpan = existingRoleTag.querySelector('.role-tag-container > span:nth-child(1)');
                      roleSpan.textContent = matchedName.role;
                  
                      const idSpan = existingRoleTag.querySelector('.role-tag-container > span:nth-child(2)');
                      idSpan.textContent = matchedName.id;
                  
                      const imgSpan = existingRoleTag.querySelector('.role-tag-container > span:nth-child(3)');
                      
                    }
                  } else {
                    if (existingRoleTag) {
                      // existingRoleTag.style.display='none';
                      existingRoleTag.style.visibility='hidden';
                      existingRoleTag.remove();
                    }
                    li.style.display='none';
                  }
                }
              });
            } else {
              ulElement.querySelectorAll('li').forEach(li => {
                li.style.display='block';
              });
            }
          }
        } catch (error) {
          log('Error customizing conversation list: ' + error.message);
        }
      }

      customizeLinkedIn();
      removeObserver(); // Remove existing observer before creating a new one
      observer = new MutationObserver(() => {
        customizeLinkedIn();
        customizeConversationList();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (error) {
      console.log('Error in LinkedIn Customizer script: ' + error.message);
    }
  }

  injectScript();
})();