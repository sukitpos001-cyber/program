// 1. ตั้งค่าการเชื่อมต่อ
const SUPABASE_URL = 'https://tfushiexgasfrftdwzdt.supabase.co';
// อย่าลืมเอา API Key ของคุณมาใส่ตรงนี้นะครับ
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmdXNoaWV4Z2FzZnJmdGR3emR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNjAxMDEsImV4cCI6MjA5OTczNjEwMX0.ZKkZuZAhK7MX1nl1kD_coq8HzfyVtRlBDFTvXUrOkkY';

// ✅ เปลี่ยนชื่อตัวแปรใหม่เป็น supabaseClient เพื่อไม่ให้ชื่อชนกัน
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. ฟังก์ชัน READ (ดึงข้อมูลมาโชว์)
async function fetchData() {
    // ✅ ใช้ supabaseClient ดึงข้อมูล
    const { data, error } = await supabaseClient.from('fuel_types').select('*');
    
    if (error) {
        console.error(error);
        alert('ดึงข้อมูลไม่ได้: ' + error.message);
        return;
    }
    
    const tbody = document.getElementById('fuelTable');
    tbody.innerHTML = '';
    
    data.forEach(item => {
        // ใช้ item.fuel_id ให้ตรงกับในตาราง Supabase
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
    
    if (!name) {
        alert("กรุณากรอกชื่อเชื้อเพลิง");
        return;
    }

    // ✅ ใช้ supabaseClient บันทึกข้อมูล
    const { error } = await supabaseClient.from('fuel_types').insert([{ name: name, description: desc }]);
    
    if (error) {
        alert('บันทึกไม่ได้: ' + error.message);
    } else {
        alert('บันทึกสำเร็จ!');
        document.getElementById('fuelName').value = '';
        document.getElementById('fuelDesc').value = '';
        fetchData(); 
    }
}

// 4. ฟังก์ชัน DELETE (ลบข้อมูล)
async function deleteData(id) {
    if(!confirm("ยืนยันการลบ?")) return;
    
    // ✅ ใช้ supabaseClient ลบข้อมูล
    const { error } = await supabaseClient.from('fuel_types').delete().eq('fuel_id', id);
    
    if (error) {
        alert('ลบไม่ได้: ' + error.message);
    } else {
        fetchData();
    }
}

// โหลดข้อมูลทันทีเมื่อเปิดหน้าเว็บ
fetchData();
