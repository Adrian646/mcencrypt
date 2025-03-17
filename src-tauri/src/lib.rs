use aes::cipher::AsyncStreamCipher;
use aes::{cipher::KeyIvInit, Aes256};
use glob::glob;
use glob_match::glob_match;
use rand::{distr::Alphanumeric, Rng};
use serde_json::{json, Value};
use std::fs::{read, read_dir, File};
use std::io::Write;
use std::path::Path;
use tauri::ipc::Response;
use tauri::{AppHandle, Emitter};
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

#[tauri::command]
fn get_pack_image(selected_folder: &str) -> Response {
    let found_image_option = read_dir(selected_folder).unwrap().find(|x| {
        let file_name = x.as_ref().unwrap().file_name();
        return file_name == "pack_icon.png";
    });

    if found_image_option.is_none() {
        return Response::new(Vec::new());
    }

    let found_image = found_image_option.unwrap().unwrap();

    let image_data = read(found_image.path()).unwrap();
    return Response::new(image_data);
}

fn generate_alphanumeric_key() -> Vec<u8> {
    let key: String = rand::rng()
        .sample_iter(Alphanumeric)
        .take(32)
        .map(char::from)
        .collect();
    return key.as_bytes().to_vec();
}

type AESEncryptor = cfb8::Encryptor<Aes256>;

#[tauri::command(async)]
fn encrypt_from_path(
    app: AppHandle,
    path: &str,
    dest_path: &str,
    master_key: &str,
    pack_uuid: &str,
    formated_zip_name: &str,
) -> bool {
    let zip_name = String::from(formated_zip_name) + ".zip";
    let zip_path = Path::new(dest_path).join(&zip_name);

    let excluded_patterns = vec![
        "pack_icon.{png,jpg}",
        "manifest.json",
        "bug_pack_icon.{png,jpg}",
        "texts/**/*",
    ];

    let mut contents_json = json!({
        "content": []
    });

    let contents_arr: &mut Vec<Value> = contents_json
        .get_mut("content")
        .unwrap()
        .as_array_mut()
        .unwrap();

    let file = File::create(zip_path).expect("Failed To Create Destination Zip");
    let mut zip = ZipWriter::new(file);

    fn encrypt_contents_file(
        master_key: &str,
        contents_json: Value,
        mut zip: ZipWriter<File>,
        uuid: &str,
    ) -> bool {
        let uuid_len = uuid.len();

        let key_bytes = master_key.as_bytes();
        let iv = &key_bytes[0..16];
        let encryptor = AESEncryptor::new_from_slices(key_bytes, iv).unwrap();

        let mut contents_bytes = serde_json::to_vec(&contents_json).unwrap();
        let options = SimpleFileOptions::default();

        zip.start_file("contents.json", options).unwrap();

        zip.write_all(&[0x00, 0x00, 0x00, 0x00]).unwrap();
        zip.write_all(&[0xFC, 0xB9, 0xCF, 0x9B]).unwrap();

        zip.write_all((0..0x08).map(|_| 0x00).collect::<Vec<u8>>().as_mut_slice())
            .unwrap();

        zip.write_all(&[uuid_len as u8]).unwrap();
        zip.write_all(uuid.as_bytes()).unwrap();

        zip.write_all((0..0x0cb).map(|_| 0x00).collect::<Vec<u8>>().as_mut_slice())
            .unwrap();

        encryptor.encrypt(&mut contents_bytes);
        zip.write_all(&contents_bytes).unwrap();
        return true;
    }

    for entry in glob(&format!("{}/**/*", path)).expect("Failed to read glob pattern") {
        match entry {
            Ok(glob_path) => {
                if !glob_path.is_file() {
                    continue;
                }

                let path_str = glob_path.to_str().unwrap();
                let relative_path = &path_str.replace(path, "")[1..].replace("\\", "/");

                let is_skipped = excluded_patterns
                    .iter()
                    .any(|x| glob_match(*x, relative_path));

                let mut file_contents = read(path_str).expect("Failed To Read File.");
                let options = SimpleFileOptions::default();

                if is_skipped {
                    println!("skipped, {}", path_str);
                    contents_arr.push(json!({
                        "path": relative_path,
                        "key": null
                    }));

                    zip.start_file(relative_path, options).unwrap();
                    zip.write_all(&file_contents).unwrap();

                    continue;
                }

                let sub_key = generate_alphanumeric_key();
                let iv = &sub_key[0..16];
                let encryptor = AESEncryptor::new_from_slices(&sub_key, iv).unwrap();
                encryptor.encrypt(file_contents.as_mut_slice());

                contents_arr.push(json!({
                    "path": relative_path,
                    "key": String::from_utf8(sub_key).unwrap()
                }));

                zip.start_file(relative_path, options).unwrap();
                zip.write_all(&file_contents).unwrap();
            }
            Err(err) => app.emit("error", err.to_string()).unwrap(),
        }
    }

    let was_sucessfull = encrypt_contents_file(master_key, contents_json, zip, pack_uuid);

    let mut file = File::create(Path::new(dest_path).join(zip_name + ".key")).unwrap();
    file.write_all(master_key.as_bytes()).unwrap();

    return was_sucessfull;
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_pack_image, encrypt_from_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
