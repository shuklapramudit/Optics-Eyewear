const getInitials = (fullName = "") => {

  const name = fullName.trim();


  if (!name) {
    return "GU";
  }


  const parts = name.split(/\s+/);


  if (parts.length === 1) {

    return parts[0]
      .charAt(0)
      .toUpperCase();

  }


  const firstLetter =
    parts[0].charAt(0).toUpperCase();


  const lastLetter =
    parts[parts.length - 1]
      .charAt(0)
      .toUpperCase();


  return `${firstLetter}${lastLetter}`;
};


export default getInitials;