# Changelog

All notable changes to this project from 1.0.0 forward will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2023-01-20

### Added

-   `createSqlitePdo` function exported to better typing sqliteOptions

## [1.2.0] - 2023-01-10

### Changed

-   Update to Lupdo ^3.0.0

## [1.1.3] - 2023-01-05

### Changed

-   Update to Lupdo ^2.1.0

## [1.1.2] - 2022-12-31

### Fixed

-   Not Integer Number returned as string

## [1.1.1] - 2022-12-28

### Changed

-   Update to Lupdo ^2.0.0

## [1.1.0] - 2022-12-28

### Fixed

-   BigInt when Number < Number.MIN_SAFE_INTEGER

## [1.0.1] - 2022-12-27

### Added

-   bypass better-sqlite overrides when `pdo.getRawDriverConnection()` is called

## [1.0.0] - 2022-12-27

First Public Release On Npm
