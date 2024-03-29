export function genId() {
  return Math.random().toString(36).substr(2, 10);
}

export function addArrayItem<T>(array: T[], item: T) {
  array.push(item);
}

export function removeArrayItem<T>(array: T[], item: T): number[] | null {
  const idx = array.indexOf(item);
  if (idx > -1) {
    array.splice(idx, 1);
    const total = array.length;
    if (idx > total - 1) {
      return null;
    }
    return [idx, total - 1];
  }
  return null;
}

export function moveArrayItem<T>(
  array: T[], item: T, gap: number, swapInfo?: (it1: T, it2: T) => void
): number[] | null {
  const total = array.length;
  const idxCur = array.indexOf(item);
  if (idxCur < 0) {
    return null;
  }
  const idxTarget = idxCur + gap;
  if (idxTarget === idxCur || idxTarget < 0 || idxTarget > total - 1) {
    return null;
  }

  const swapChildren = (arr: Array<any>, idx1: number, idx2: number) => {
    [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]];
  }

  let idxMove = idxCur;
  while (idxMove !== idxTarget) {
    const idxNext = idxMove < idxTarget ? idxMove + 1 : idxMove - 1;
    if (idxNext > total - 1 || idxNext < 0) {
      throw Error(`unexpected index values: ${idxCur}(cur), ${idxTarget}(target)`);
    }
    if (typeof swapInfo === 'function') {
      swapInfo(array[idxMove], array[idxNext]);
    }
    swapChildren(array, idxMove, idxNext);
    idxMove = idxNext;
  }
  return idxCur <= idxTarget ? [idxCur, idxTarget] : [idxTarget, idxCur];
}