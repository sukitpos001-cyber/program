// 1. ตั้งค่าการเชื่อมต่อ (นำค่าจากหน้า Dashboard ของ Supabase มาใส่)
const SUPABASE_URL = 'https://tfushiexgasfrftdwzdt.supabase.co';
const SUPABASE_KEY = 'ใส่คีย์ยาวๆ ที่ขึ้นต้นด้วย eyJhb... ของคุณตรงนี้'; 
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. ฟังก์ชัน READ (ดึงข้อมูลมาโชว์)
async function fetchData() {
    const { data, error } = await supabase.from('fuel_types').select('*');
    
    // ถ้ามี Error ให้แจ้งเตือนบนหน้าจอ จะได้รู้สาเหตุ
    if (error) {
        console.error(error);
        alert('ดึงข้อมูลไม่ได้: ' + error.message);
        return;
    }
    
    const tbody = document.getElementById('fuelTable');
    tbody.innerHTML = '';
    
    data.forEach(item => {
        // ✅ แก้ไข item.id เป็น item.fuel_id ให้ตรงกับ Supabase ของคุณ
        tbody.innerHTML += `<tr>
            <td>${item.name}</td>
            <td>${item.description || '-'}</td>
            <td><button onclick="deleteData('${item.fuel_id}')">ลบ</button></td> 
        </tr>`;
    });
}

// 3. ฟังก์ชัน CREATE (เพิ่มข้อมูล)
async function addData() {
    const name = document.getElementById('fuelName').value;
    const desc = document.getElementById('fuelDesc').value;
    
    // ป้องกันการกดบันทึกช่องว่าง
    if (!name) {
        alert("กรุณากรอกชื่อเชื้อเพลิง");
        return;
    }

    const { error } = await supabase.from('fuel_types').insert([{ name: name, description: desc }]);
    
    if (error) {
        alert('บันทึกไม่ได้: ' + error.message);
    } else {
        alert('บันทึกสำเร็จ!');
        // ล้างค่าในช่องกรอก
        document.getElementById('fuelName').value = '';
        document.getElementById('fuelDesc').value = '';
        fetchData(); // ดึงข้อมูลใหม่มาโชว์
    }
}

// 4. ฟังก์ชัน DELETE (ลบข้อมูล)
async function deleteData(id) {
    if(!confirm("ยืนยันการลบ?")) return;
    
    // ✅ แก้ไข .eq('id', id) เป็น .eq('fuel_id', id)
    const { error } = await supabase.from('fuel_types').delete().eq('fuel_id', id);
    
    if (error) {
        alert('ลบไม่ได้: ' + error.message);
    } else {
        fetchData();
    }
}

// โหลดข้อมูลทันทีเมื่อเปิดหน้าเว็บ
fetchData();
