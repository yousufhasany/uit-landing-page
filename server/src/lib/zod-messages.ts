import { z } from 'zod';

/** Plain-language defaults for validation errors shown to CMS editors; explicit schema messages still win. */
z.config({
  customError: (issue) => {
    switch (issue.code) {
      case 'too_small':
        if (issue.origin === 'string') return Number(issue.minimum) <= 1 ? 'This field is required' : `Use at least ${issue.minimum} characters`;
        if (issue.origin === 'array') return `Add at least ${issue.minimum}`;
        if (issue.origin === 'number') return `Must be ${issue.minimum} or more`;
        return undefined;
      case 'too_big':
        if (issue.origin === 'string') return `Use at most ${issue.maximum} characters`;
        if (issue.origin === 'array') return `No more than ${issue.maximum} items`;
        if (issue.origin === 'number') return `Must be ${issue.maximum} or less`;
        return undefined;
      case 'invalid_type':
        if (issue.input === undefined || issue.input === null) return 'This field is required';
        return issue.expected === 'number' ? 'Enter a number' : issue.expected === 'date' ? 'Enter a valid date' : undefined;
      case 'invalid_format':
        if (issue.format === 'uuid') return 'Select a valid option';
        if (issue.format === 'email') return 'Enter a valid email address';
        if (issue.format === 'url') return 'Enter a full URL starting with https://';
        return undefined;
      case 'invalid_value':
        return 'Choose one of the available options';
      default:
        return undefined;
    }
  },
});
