// 1. ตั้งค่าการเชื่อมต่อ (นำค่าจากหน้า Dashboard ของ Supabase มาใส่)
const SUPABASE_URL = 'https://tfushiexgasfrftdwzdt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PhOMjxCCX0nd3O484QeGpA_yiZp11i4'; // ใส่ตัวที่เขียนว่า anon public
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. ฟังก์ชัน READ (ดึงข้อมูลมาโชว์)
async function fetchData() {
    const { data, error } = await supabase.from('fuel_types').select('*');
    if (error) return console.error(error);
    
    const tbody = document.getElementById('fuelTable');
    tbody.innerHTML = '';
    data.forEach(item => {
        tbody.innerHTML += `<tr>
            <td>${item.name}</td>
            <td>${item.description}</td>
            <td><button onclick="deleteData('${item.id}')">ลบ</button></td>
        </tr>`;
    });
}

// 3. ฟังก์ชัน CREATE (เพิ่มข้อมูล)
async function addData() {
    const name = document.getElementById('fuelName').value;
    const desc = document.getElementById('fuelDesc').value;
    
    const { error } = await supabase.from('fuel_types').insert([{ name: name, description: desc }]);
    if (error) alert(error.message);
    else {
        alert('บันทึกสำเร็จ!');
        fetchData(); // ดึงข้อมูลมาอัปเดตตารางใหม่
    }
}

// 4. ฟังก์ชัน DELETE (ลบข้อมูล)
async function deleteData(id) {
    if(!confirm("ยืนยันการลบ?")) return;
    const { error } = await supabase.from('fuel_types').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchData();
}

// โหลดข้อมูลทันทีเมื่อเปิดหน้าเว็บ
fetchData();