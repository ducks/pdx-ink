{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  packages = with pkgs; [ ruby nodejs chromium ];
  CHROMIUM_PATH = "${pkgs.chromium}/bin/chromium";
}
