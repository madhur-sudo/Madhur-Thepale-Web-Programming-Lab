const capitals = {
  Bhutan: "Thimphu",
  Morocco: "Rabat",
  Slovenia: "Ljubljana",
  Kazakhstan: "Astana",
  Madagascar: "Antananarivo"
};

const countrySelect = document.getElementById("countrySelect");
const capital = document.getElementById("capital");

countrySelect.addEventListener("change", function () {
  const selectedCountry = countrySelect.value;
  capital.textContent = selectedCountry
    ? capitals[selectedCountry]
    : "Select a country";
});
