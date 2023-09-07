# cashlogix

Expenses visualization.
Used with [locash](https://github.com/GABAnich/locash)

> ./expenses.json
>
> { "date": "1662731044", "value": "-50", "description": "coffee" }

> ./expenses.csv
>
> "date","description","value"
> 1662731044,coffee,-50

```bash
csvtojson expenses.csv > expenses.json
npm run dev
open out.html
```
