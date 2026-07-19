// 1. ตั้งค่าการเชื่อมต่อ
const SUPABASE_URL = 'https://tfushiexgasfrftdwzdt.supabase.co';
// อย่าลืมเอา API Key ของคุณมาใส่ตรงนี้นะครับ
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmdXNoaWV4Z2FzZnJmdGR3emR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNjAxMDEsImV4cCI6MjA5OTczNjEwMX0.ZKkZuZAhK7MX1nl1kD_coq8HzfyVtRlBDFTvXUrOkkY';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ✅ ตัวแปรใหม่: ใช้เก็บ ID ของเชื้อเพลิงที่เรากำลังคลิกแก้ไข
let editFuelId = null; 

// 1. ฟังก์ชัน READ 
async function fetchData() {
    // แอบเพิ่ม .order() เพื่อให้เรียงตามตัวอักษร ข้อมูลจะได้เป็นระเบียบครับ
    const { data, error } = await supabaseClient.from('fuel_types').select('*').order('name', { ascending: true });
    
    if (error) return alert('ดึงข้อมูลไม่ได้: ' + error.message);
    
    const tbody = document.getElementById('fuelTable');
    tbody.innerHTML = '';
    
    data.forEach(item => {
        // ✅ เพิ่มปุ่ม "แก้ไข" และส่งข้อมูลขึ้นไปที่ฟังก์ชัน prepareEdit
        tbody.innerHTML += `<tr>
            <td>${item.name}</td>
            <td>${item.description || '-'}</td>
            <td>
                <button onclick="prepareEdit('${item.fuel_id}', '${item.name}', '${item.description || ''}')">แก้ไข</button>
                <button onclick="deleteData('${item.fuel_id}')">ลบ</button>
            </td> 
        </tr>`;
    });
}

// 2. ✅ ฟังก์ชันใหม่: ดึงข้อมูลขึ้นไปที่ช่องกรอก และเปลี่ยนปุ่ม
function prepareEdit(id, name, desc) {
    editFuelId = id; // จำ ID ที่จะแก้ไว้
    document.getElementById('fuelName').value = name;
    document.getElementById('fuelDesc').value = desc;

    // เปลี่ยนข้อความปุ่มบันทึก เป็น "อัปเดตข้อมูล"
    const saveBtn = document.querySelector('button[onclick="addData()"]');
    if (saveBtn) saveBtn.innerText = 'อัปเดตข้อมูล';

    // สร้างปุ่ม "ยกเลิก" (Cancel) ถ้ายังไม่มี
    let cancelBtn = document.getElementById('cancelBtn');
    if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelBtn';
        cancelBtn.innerText = 'ยกเลิก';
        cancelBtn.onclick = cancelEdit;
        cancelBtn.style.marginLeft = '10px';
        saveBtn.parentNode.insertBefore(cancelBtn, saveBtn.nextSibling);
    } else {
        cancelBtn.style.display = 'inline-block';
    }
}

// 3. ✅ ฟังก์ชันใหม่: เมื่อกดปุ่มยกเลิก ให้คืนค่าทุกอย่างกลับเป็นปกติ
function cancelEdit() {
    editFuelId = null; // ล้างความจำ ID
    document.getElementById('fuelName').value = '';
    document.getElementById('fuelDesc').value = '';
    
    const saveBtn = document.querySelector('button[onclick="addData()"]');
    if (saveBtn) saveBtn.innerText = 'บันทึกข้อมูล'; 
    
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) cancelBtn.style.display = 'none'; // ซ่อนปุ่มยกเลิก
}

// 4. ฟังก์ชัน CREATE & UPDATE (รวมไว้ในปุ่มเดียว)
async function addData() {
    const name = document.getElementById('fuelName').value;
    const desc = document.getElementById('fuelDesc').value;
    
    if (!name) return alert("กรุณากรอกชื่อเชื้อเพลิง");

    if (editFuelId) {
        // ----- โหมดแก้ไข (UPDATE) -----
        const { error } = await supabaseClient
            .from('fuel_types')
            .update({ name: name, description: desc })
            .eq('fuel_id', editFuelId); // อัปเดตเฉพาะบรรทัดที่ตรงกับ ID
            
        if (error) {
            alert('อัปเดตไม่ได้: ' + error.message);
        } else {
            alert('อัปเดตสำเร็จ!');
            cancelEdit(); // เคลียร์ช่องกรอกและปุ่ม
            fetchData();  // ดึงข้อมูลใหม่
        }
    } else {
        // ----- โหมดเพิ่มใหม่ (INSERT) ของเดิม -----
        const { error } = await supabaseClient
            .from('fuel_types')
            .insert([{ name: name, description: desc }]);
        
        if (error) {
            alert('บันทึกไม่ได้: ' + error.message);
        } else {
            alert('บันทึกสำเร็จ!');
            cancelEdit(); 
            fetchData(); 
        }
    }
}

// 5. ฟังก์ชัน DELETE 
async function deleteData(id) {
    if(!confirm("ยืนยันการลบ?")) return;
    const { error } = await supabaseClient.from('fuel_types').delete().eq('fuel_id', id);
    if (error) alert('ลบไม่ได้: ' + error.message);
    else fetchData();
}

// โหลดข้อมูลเมื่อเปิดหน้าเว็บ
fetchData();
