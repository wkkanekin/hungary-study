<div id="priceTable"></div>

<script>
fetch('prices.json')
  .then(res => res.json())
  .then(data => {
    const rows = (data.items || [])
      .filter(item => item.status === 'ok')
      .map(item => `
        <tr>
          <td>${item.label_ja}</td>
          <td>${item.price_huf.toLocaleString()} Ft</td>
          <td>${item.unit || ''}</td>
        </tr>
      `).join('');

    document.getElementById('priceTable').innerHTML = `
      <table class="priceTable">
        <thead>
          <tr>
            <th>品目</th>
            <th>価格</th>
            <th>単位</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  })
  .catch(err => {
    console.error(err);
    document.getElementById('priceTable').innerHTML = '<p>物価データの読み込みに失敗しました。</p>';
  });
</script>