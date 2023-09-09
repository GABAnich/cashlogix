const expenses_by_category_ctx = document.getElementById('expenses_by_category');
new Chart(expenses_by_category_ctx, {
  type: 'bar',
  data: {
    labels: expenses_by_category.map(({ description }) => description),
    datasets: [{
      label: '# of Votes',
      data: expenses_by_category.map(({ value }) => value),
      borderWidth: 1
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});

const category_percentages_ctx = document.getElementById('category_percentages');
new Chart(category_percentages_ctx, {
  type: 'pie',
  data: {
    labels: category_percentages.map(({ description }) => description),
    datasets: [{
      label: '% ',
      data: category_percentages.map(({ percentage }) => percentage),
      borderWidth: 1
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});

