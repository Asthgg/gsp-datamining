export const dateToformat = (date) => {
    return `${date.getFullYear()}-${`00${
      date.getMonth() + 1
    }`.slice(-2)}-${`00${date.getDate()}`.slice(
      -2,
    )} ${`0${date.getHours()}`.slice(
      -2,
    )}:${`00${date.getMinutes()}`.slice(
      -2,
    )}:${`00${date.getSeconds()}`.slice(
      -2,
    )}`;
};


export const dateToUTCformat = (date) => {
    return `${date.getUTCFullYear()}-${`00${
      date.getUTCMonth() + 1
    }`.slice(-2)}-${`00${date.getDate()}`.slice(
      -2,
    )} ${`0${date.getUTCHours()}`.slice(
      -2,
    )}:${`00${date.getUTCMinutes()}`.slice(
      -2,
    )}:${`00${date.getUTCSeconds()}`.slice(
      -2,
    )}`;
};

export const getDates = (date1, date2) => {
  const dateInit = Number(date1.substring(0, 7).replace('-', ''));

  const dateEnd = Number(date2.substring(0, 7).replace('-', ''));

  if (dateEnd - dateInit < 0) {
    throw "Final date must be grater than initial date";
  }

  const result = [];

  let crtDate = dateInit;

  let date = '';

  let yearNumber = 0;

  while ( crtDate <= dateEnd ) {
    date = crtDate.toString();
    result.push(date);
    if (date.substring(4, 7) === '12') {
      yearNumber = Number(date.substring(0, 4)) + 1;
      crtDate = Number(`${yearNumber.toString()}01`);
    } else {
      crtDate += 1;
    }
  }

  return result;
}
