export const donationCategories = [
  { value: "clothes", label: "Clothes" },
  { value: "shoes", label: "Shoes" },
  { value: "accessories", label: "Accessories" },
  { value: "food", label: "Food" },
  { value: "education", label: "Education" },
  { value: "hygiene", label: "Hygiene" },
  { value: "medical", label: "Medical supplies" },
  { value: "furniture", label: "Furniture" },
  { value: "beauty", label: "Beauty and care" },
  { value: "other", label: "Other" },
];

export function getDonationCategoryLabel(value) {
  return donationCategories.find((category) => category.value === value)?.label || value;
}
