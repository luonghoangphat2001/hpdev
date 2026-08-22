const actionTargets = new Map();
let delegationInstalled = false;

export function encodeActionArgs(...args) {
  return encodeURIComponent(JSON.stringify(args));
}

export function registerActionTarget(scope, target) {
  actionTargets.set(scope, target);
  installDelegation();
}

function installDelegation() {
  if (delegationInstalled) {
    return;
  }

  delegationInstalled = true;

  const delegatedEvents = [
    'click',
    'change',
    'input',
    'keydown',
    'submit',
  ];

  for (const eventName of delegatedEvents) {
    document.addEventListener(eventName, (event) => {
      dispatchAction(eventName, event);
    });
  }
}

async function dispatchAction(eventName, event) {
  const element = event.target.closest?.(`[data-${eventName}-action], [data-action]`);

  if (!element) {
    return;
  }

  const action = element.dataset[`${eventName}Action`] || element.dataset.action;

  if (element.dataset.actionEvent && element.dataset.actionEvent !== eventName) {
    return;
  }

  if (element.dataset.actionKey && element.dataset.actionKey !== event.key) {
    return;
  }

  if (!action) {
    return;
  }

  const separator = action.indexOf('.');

  if (separator < 1) {
    return;
  }

  const target = actionTargets.get(action.slice(0, separator));
  const method = action.slice(separator + 1);

  if (!target || typeof target[method] !== 'function') {
    return;
  }

  if (eventName === 'submit' || element.dataset.preventDefault === 'true') {
    event.preventDefault();
  }

  if (element.dataset.stopPropagation === 'true') {
    event.stopPropagation();
  }

  const args = element.dataset.actionArgs
    ? JSON.parse(decodeURIComponent(element.dataset.actionArgs))
    : [];
  if (element.dataset.passValue === 'true') {
    args.push(element.value);
  }

  if (element.dataset.passElement === 'true') {
    args.push(element);
  }

  if (element.dataset.passEvent === 'true') {
    args.push(event);
  }

  await target[method](...args);
}
