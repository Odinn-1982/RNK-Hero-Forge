const MOD = 'rnk-hero-forge';

function isDebugEnabled() {
  try {
    return !!game?.settings?.get?.(MOD, 'enableDebug');
  } catch (e) {
    return false;
  }
}

export const logger = {
  log: (...args) => { if (isDebugEnabled()) console.log(MOD, '|', ...args); },
  debug: (...args) => { if (isDebugEnabled()) console.debug(MOD, '|', ...args); },
  warn: (...args) => { console.warn(MOD, '|', ...args); },
  error: (...args) => { console.error(MOD, '|', ...args); },
};

export default logger;
