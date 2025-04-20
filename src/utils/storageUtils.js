/**
 * Save a value to localStorage with proper JSON serialization
 * @param {string} name - The key to store under
 * @param {any} val - The value to store
 */
export function saveToStorage(name, val) {
  localStorage.setItem(name, JSON.stringify(val));
}

/**
 * Load and parse a value from localStorage
 * @param {string} name - The key to load
 * @param {Function} validator - Optional function to validate the parsed data
 * @param {any} defaultValue - Value to return if loading fails
 * @returns {any} The parsed value or defaultValue
 */
export function loadFromStorage(name, validator = null, defaultValue = null) {
  try {
    const str = localStorage.getItem(name);
    if (!str) return defaultValue;

    const parsed = JSON.parse(str);
    if (validator && !validator(parsed)) {
      console.warn(`Invalid data loaded from ${name}`);
      return defaultValue;
    }

    return parsed;
  } catch (e) {
    console.error(`Error loading ${name} from storage:`, e);
    return defaultValue;
  }
}

// Validators
export const arrayValidator = arr => Array.isArray(arr);