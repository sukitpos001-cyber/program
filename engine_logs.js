let editLogId = null;

// 1. ดึงรายชื่อพนักงานมาใส่ใน Dropdown ก่อนเลย
async function loadEmployees() {
    const { data, error } = await supabaseClient
        .from('employees')
        .select('name')
        .order('name', { ascending: true });

    const select = document.getElementById('empSelect');
    if (error) {
        select.innerHTML = '<option value="">โหลดข้อมูลไม่สำเร็จ</option>';
        return;
    }

    select.innerHTML = '<option value="">-- เลือกพนักงาน --</option>';
    data.forEach(emp => {
        select.innerHTML += `<option value="${emp.name}">${emp.name}</option>`;
    });
}

// 2. ดึงข้อมูลบันทึกการทำงาน (READ)
async function fetchData() {
    const { data, error } = await supabaseClient
        .from('engine_logs')
        .select('*')
        .order('datetime', { ascending: false }); // เรียงจากเวลาล่าสุดขึ้นก่อน
    
    if (error) {
        Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
        return;
    }
    
    const tbody = document.getElementById('logTable');
    tbody.innerHTML = '';
    
    data.forEach(item => {
        // แปลงรูปแบบเวลาให้ดูง่ายขึ้น
        const dateObj = item.datetime ? new Date(item.datetime).toLocaleString('th-TH') : '-';
        
        tbody.innerHTML += `
        <tr class="hover:bg-gray-100 transition duration-150 border-b">
            <td class="p-3">${dateObj}</td>
            <td class="p-3">${item.e1_kwh || '0'}</td>
            <td class="p-3">${item.e1_h || '0'}</td>
            <td class="p-3">${item.e2_kwh || '0'}</td>
            <td class="p-3">${item.e2_h || '0'}</td>
            <td class="p-3">${item.employees || '-'}</td>
            <td class="p-3">${item.note || '-'}</td>
            <td class="p-3 text-center">
                <button onclick="deleteData('${item.engine_id}')" 
                        class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                    ลบ
                </button>
            </td> 
        </tr>`;
    });
}

// 3. ฟังก์ชันบันทึกข้อมูล (CREATE)
async function saveData() {
    const datetime = document.getElementById('logDatetime').value;
    const e1_kwh = document.getElementById('e1Kwh').value;
    const e1_h = document.getElementById('e1H').value;
    const e2_kwh = document.getElementById('e2Kwh').value;
    const e2_h = document.getElementById('e2H').value;
    const employee = document.getElementById('empSelect').value;
    const note = document.getElementById('logNote').value;
    
    if (!datetime || !employee) {
        Swal.fire('แจ้งเตือน', 'กรุณากรอก วัน-เวลา และเลือกพนักงาน', 'warning');
        return;
    }

    // เตรียมแพ็กเกจข้อมูล (แปลงค่าว่างให้เป็น null เพื่อป้องกัน Error ตัวเลข)
    const payload = { 
        datetime: datetime,
        e1_kwh: e1_kwh ? e1_kwh : null,
        e1_h: e1_h ? e1_h : null,
        e2_kwh: e2_kwh ? e2_kwh : null,
        e2_h: e2_h ? e2_h : null,
        employees: [employee], // ส่งเป็น Array ตามประเภทข้อมูล _text ใน Database
        note: note
    };

    const { error } = await supabaseClient
        .from('engine_logs')
        .insert([payload]);
    
    if (error) {
        Swal.fire('บันทึกล้มเหลว', error.message, 'error');
    } else {
        Swal.fire('สำเร็จ', 'บันทึกข้อมูลเครื่องยนต์เรียบร้อย', 'success');
        
        // เคลียร์ฟอร์ม
        document.getElementById('logDatetime').value = '';
        document.getElementById('e1Kwh').value = '';
        document.getElementById('e1H').value = '';
        document.getElementById('e2Kwh').value = '';
        document.getElementById('e2H').value = '';
        document.getElementById('empSelect').value = '';
        document.getElementById('logNote').value = '';
        
        fetchData();
    }
}

// 4. DELETE
function deleteData(id) {
    Swal.fire({
        title: 'ยืนยันการลบ?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ลบเลย!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { error } = await supabaseClient.from('engine_logs').delete().eq('engine_id', id);
            if (error) Swal.fire('ลบล้มเหลว', error.message, 'error');
            else {
                Swal.fire('ลบสำเร็จ!', '', 'success');
                fetchData();
            }
        }
    });
}

// โหลดข้อมูลรายชื่อพนักงานก่อน แล้วค่อยดึงข้อมูลตาราง
async function init() {
    await loadEmployees();
    await fetchData();
}

// เริ่มต้นทำงาน
init();
