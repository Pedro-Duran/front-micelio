const MOBILE_UA_REGEX = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;

export const isMobileDevice = () => MOBILE_UA_REGEX.test(navigator.userAgent);
