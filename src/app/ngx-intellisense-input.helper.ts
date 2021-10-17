export function validateFormula(value: string, references: Array<string>) {
  if (!value) return;

  // case 1: valid characters
  if (/[^+\-%*/a-zA-Z0-9\(\)\s#]+/gi.test(value)) {
    return {
      invalidCharacters: true,
    };
  }

  // case 2: only allow '#' var and number as parameter
  const terms = value.split(/[\/\*\+\-\%]/);

  // case 3: at least 2 terms

  if (terms.length < 2) {
    return {
      atLeast2Terms: true,
    };
  }

  terms.forEach((term: string, index: number, self) => {
    const cleanTerm = term.replace(/[\(\)\\s]/, '').trim();

    let isNotTerm: boolean;

    // empty
    if (!cleanTerm) {
      isNotTerm = true;
    }

    // param which starts without '#' and not in the reference list will be invalid
    if (
      isNaN(+cleanTerm) &&
      (cleanTerm.charAt(0) !== '#' || references.indexOf(cleanTerm) === -1)
    ) {
      isNotTerm = true;
    }

    // it is not a term of mathematic expression
    if (isNotTerm) {
      return {
        invalidTerms: true,
      };
    }
  });

  // case 4: dividing by 0
  if (/\/\s{0,}0/g.test(value)) {
    return {
      dividingByZero: true,
    };
  }

  return;
}

export function breakLineAsBr() {
  const docFragment = document.createDocumentFragment();

  //add a new line
  const newEle = document.createTextNode('\n');
  docFragment.appendChild(newEle);

  //add the br, or p, or something else
  const newEle2 = document.createElement('br');
  docFragment.appendChild(newEle2);

  //make the br replace selection
  let range = window.getSelection().getRangeAt(0);
  range.deleteContents();
  range.insertNode(docFragment);

  //create a new range
  range = document.createRange();
  range.setStartAfter(newEle);
  range.collapse(true);

  //make the cursor there
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}
