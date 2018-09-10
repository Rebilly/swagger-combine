const { inspect } = require('util');

// copied from node@10 because node@8 default diff is ugly
// https://github.com/nodejs/node/blob/cdb359840c9537e460b1bf0536fc36ec5fe2db2d/lib/internal/assert.js

let blue = '';
let green = '';
let white = '';
let red = '';

if (process.stderr.isTTY && process.stderr.getColorDepth && process.stderr.getColorDepth() !== 1) {
  blue = '\u001b[34m';
  green = '\u001b[32m';
  white = '\u001b[39m';
  red = '\u001b[31m';
};

function inspectValue(val) {
  // The util.inspect default values could be changed. This makes sure the
  // error messages contain the necessary information nevertheless.
  return JSON.stringify(val, null, 2).split('\n');
}

function createErrDiff(actual, expected, message) {
  var other = '';
  var res = '';
  var lastPos = 0;
  var end = '';
  var skipped = false;
  const actualLines = inspectValue(actual);
  const expectedLines = inspectValue(expected);
  const msg = message +
        `:\n${green}+ expected${white} ${red}- actual${white}`;
  const skippedMsg = ` ${blue}...${white} Lines skipped`;

  // Remove all ending lines that match (this optimizes the output for
  // readability by reducing the number of total changed lines).
  var a = actualLines[actualLines.length - 1];
  var b = expectedLines[expectedLines.length - 1];
  var i = 0;
  while (a === b) {
    if (i++ < 2) {
      end = `\n  ${a}${end}`;
    } else {
      other = a;
    }
    actualLines.pop();
    expectedLines.pop();
    if (actualLines.length === 0 || expectedLines.length === 0)
      break;
    a = actualLines[actualLines.length - 1];
    b = expectedLines[expectedLines.length - 1];
  }
  if (i > 3) {
    end = `\n${blue}...${white}${end}`;
    skipped = true;
  }
  if (other !== '') {
    end = `\n  ${other}${end}`;
    other = '';
  }

  const maxLines = Math.max(actualLines.length, expectedLines.length);
  var printedLines = 0;
  var identical = 0;
  for (i = 0; i < maxLines; i++) {
    // Only extra expected lines exist
    const cur = i - lastPos;
    if (actualLines.length < i + 1) {
      if (cur > 1 && i > 2) {
        if (cur > 4) {
          res += `\n${blue}...${white}`;
          skipped = true;
        } else if (cur > 3) {
          res += `\n  ${expectedLines[i - 2]}`;
          printedLines++;
        }
        res += `\n  ${expectedLines[i - 1]}`;
        printedLines++;
      }
      lastPos = i;
      other += `\n${green}+${white} ${expectedLines[i]}`;
      printedLines++;
    // Only extra actual lines exist
    } else if (expectedLines.length < i + 1) {
      if (cur > 1 && i > 2) {
        if (cur > 4) {
          res += `\n${blue}...${white}`;
          skipped = true;
        } else if (cur > 3) {
          res += `\n  ${actualLines[i - 2]}`;
          printedLines++;
        }
        res += `\n  ${actualLines[i - 1]}`;
        printedLines++;
      }
      lastPos = i;
      res += `\n${red}-${white} ${actualLines[i]}`;
      printedLines++;
    // Lines diverge
    } else if (actualLines[i] !== expectedLines[i]) {
      if (cur > 1 && i > 2) {
        if (cur > 4) {
          res += `\n${blue}...${white}`;
          skipped = true;
        } else if (cur > 3) {
          res += `\n  ${actualLines[i - 2]}`;
          printedLines++;
        }
        res += `\n  ${actualLines[i - 1]}`;
        printedLines++;
      }
      lastPos = i;
      res += `\n${red}-${white} ${actualLines[i]}`;
      other += `\n${green}+${white} ${expectedLines[i]}`;
      printedLines += 2;
    // Lines are identical
    } else {
      res += other;
      other = '';
      if (cur === 1 || i === 0) {
        res += `\n  ${actualLines[i]}`;
        printedLines++;
      }
      identical++;
    }
    // Inspected object to big (Show ~20 rows max)
    if (printedLines > 20 && i < maxLines - 2) {
      return `${msg}${skippedMsg}\n${res}\n${blue}...${white}${other}\n` +
        `${blue}...${white}`;
    }
  }

  // Strict equal with identical objects that are not identical by reference.
  if (identical === maxLines) {
    // E.g., assert.deepStrictEqual(Symbol(), Symbol())
    const base = operator === 'strictEqual' ?
      'Input objects identical but not reference equal:' :
      'Input objects not identical:';

    // We have to get the result again. The lines were all removed before.
    const actualLines = inspectValue(actual);

    // Only remove lines in case it makes sense to collapse those.
    // TODO: Accept env to always show the full error.
    if (actualLines.length > 30) {
      actualLines[26] = `${blue}...${white}`;
      while (actualLines.length > 27) {
        actualLines.pop();
      }
    }

    return `${base}\n\n${actualLines.join('\n')}\n`;
  }
  return `${msg}${skipped ? skippedMsg : ''}\n${res}${other}${end}`;
}

exports.jsonDiff = createErrDiff;