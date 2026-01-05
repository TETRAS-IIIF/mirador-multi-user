import { JSDOM } from 'jsdom';

export function isHtmlFile(file: Express.Multer.File): boolean {
  const htmlMimeTypes = ['text/html', 'application/xhtml+xml'];
  return htmlMimeTypes.includes(file.mimetype);
}

/**
 * Add ID attributes to HTML elements that contain text but lack an ID.
 * @param htmlContent
 */
export function addIDToHtmlElementWithText(htmlContent: string): string {
  const { document } = new JSDOM(htmlContent).window;

  let idCounter = 1;

  // Check is document already has mmu IDs
  const existingMMUElements = document.querySelectorAll(
    `[id^="${mmuIDPrefix}"]`,
  );
  // Get last used ID number or start from 1
  if (existingMMUElements.length > 0) {
    let maxId = 0;
    existingMMUElements.forEach((el) => {
      const idNum = parseInt(el.id.replace(mmuIDPrefix, ''), 10);
      if (idNum > maxId) {
        maxId = idNum;
      }
    });
    idCounter = maxId + 1;
  }

  // Iterate through all elements in the document
  const elements = document.body.getElementsByTagName('*');
  for (const element of elements) {
    if (
      element.textContent &&
      element.textContent.trim() !== '' &&
      !element.hasAttribute('id')
    ) {
      element.setAttribute('id', `${mmuIDPrefix}${idCounter}`);
      idCounter++;
    }
  }

  return document.documentElement.outerHTML;
}

/**
 * Add a script tag before the closing </body> tag in the HTML document.
 * @param htmlContent
 */
export function addScriptTagInHtmlDocument(htmlContent: string): string {
  const closingBodyTag = '</body>';

  // Check if script is already present
  if (htmlContent.includes(script)) {
    return htmlContent; // Script already present, no need to add
  }

  // Insert the script tag before the closing </body> tag
  if (htmlContent.includes(closingBodyTag)) {
    return htmlContent.replace(
      closingBodyTag,
      `${viewerScript}${closingBodyTag}`,
    );
  } else {
    // If there's no closing </body> tag, append the script at the end
    return htmlContent + viewerScript;
  }
}
const css =
  '<style type="text/css">   @import url("/public/htmlTreeNav.css"); </style>';

// Script tag to be added
const script = '/public/htmlTreeNav.js';
const viewerScript = '<script src="' + script + '"></script>\n' + css;

// Prefix for MMU element IDs
const mmuIDPrefix = 'mmu-element-';

/**
 * Post-treatment of an uploaded HTML file to add IDs and script tag.
 * @param content
 */
export function postTreatmentOfHtmlFile(content): string {
  let updatedContent = addIDToHtmlElementWithText(content);
  updatedContent = addScriptTagInHtmlDocument(updatedContent);

  return updatedContent;
}
