const generalize_description = ({ description, ...log }) => {
  if (description.includes("movie")) return { description: "movie", ...log };
  if (description.includes("cinema")) return { description: "movie", ...log };
  return { description: "", ...log };
};

module.exports = generalize_description;
