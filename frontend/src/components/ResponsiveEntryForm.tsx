export function ResponsiveEntryForm() {
  return (
    <form className='grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow md:grid-cols-2 xl:grid-cols-3'>
      <input className='rounded border p-2' placeholder='金额' />
      <input className='rounded border p-2' placeholder='账户' />
      <input className='rounded border p-2' placeholder='分类' />
      <input className='rounded border p-2 md:col-span-2 xl:col-span-3' placeholder='备注' />
      <button className='rounded bg-indigo-600 p-2 text-white md:col-span-2 xl:col-span-1'>保存</button>
    </form>
  );
}
